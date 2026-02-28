"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

export type DebtPaymentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      householdId: null,
      error: "You must be logged in.",
    };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    return {
      supabase,
      user,
      householdId: null,
      error: membership.error?.message ?? "No household found.",
    };
  }

  return {
    supabase,
    user,
    householdId: membership.data.household_id,
    error: null,
  };
}

export async function recordDebtPaymentAction(
  _prev: DebtPaymentActionState,
  formData: FormData,
): Promise<DebtPaymentActionState> {
  const liabilityId = String(formData.get("liabilityId") ?? "");
  const paymentDate = String(
    formData.get("paymentDate") ?? new Date().toISOString().slice(0, 10),
  );
  const amount = Number(formData.get("amount") ?? 0);
  const principal = Number(formData.get("principal") ?? 0);
  const interest = Number(formData.get("interest") ?? 0);
  const fee = Number(formData.get("fee") ?? 0);
  const sourceAccountId = String(formData.get("sourceAccountId") ?? "");

  if (!liabilityId)
    return { status: "error", message: "Missing liability ID." };
  if (amount <= 0)
    return { status: "error", message: "Amount must be positive." };
  if (principal + interest + fee > amount) {
    return {
      status: "error",
      message: "Sum of components cannot exceed total amount.",
    };
  }

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return { status: "error", message: error ?? "No household found." };

  // 1. Record the payment
  const paymentInsert = await supabase
    .from("liability_payments")
    .insert({
      household_id: householdId,
      liability_id: liabilityId,
      payment_date: paymentDate,
      actual_amount: amount,
      principal_component: principal,
      interest_component: interest,
      fee_component: fee,
      source_account_id: sourceAccountId || null,
      entered_by: user.id,
    })
    .select("id")
    .single();

  if (paymentInsert.error)
    return { status: "error", message: paymentInsert.error.message };

  // 2. Update the outstanding principal balance on the liability
  if (principal > 0) {
    const { data: liability } = await supabase
      .from("liabilities")
      .select("current_principal_outstanding")
      .eq("id", liabilityId)
      .single();

    if (liability) {
      const newOutstanding = Math.max(
        0,
        Number(liability.current_principal_outstanding) - principal,
      );
      await supabase
        .from("liabilities")
        .update({ current_principal_outstanding: newOutstanding })
        .eq("id", liabilityId);
    }
  }

  // 3. If source account exists, create an expense transaction
  if (sourceAccountId) {
    await supabase.from("transactions").insert({
      household_id: householdId,
      account_id: sourceAccountId,
      type: "expense",
      amount: amount,
      transaction_date: paymentDate,
      description: `Debt payment for liability ${liabilityId}`,
      created_by: user.id,
    });
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "liability.payment_recorded",
    entityType: "liability",
    entityId: liabilityId,
    payload: { amount, principal, interest },
  });

  revalidatePath("/money");
  revalidatePath("/debts");
  revalidatePath(`/debts/${liabilityId}`);

  return {
    status: "success",
    message: "Payment recorded and balance updated.",
  };
}
