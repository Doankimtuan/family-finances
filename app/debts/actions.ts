"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

async function getAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  accountId: string,
): Promise<{ balance: number | null; error: string | null }> {
  const accountRes = await supabase
    .from("accounts")
    .select("opening_balance, type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return { balance: null, error: accountRes.error?.message ?? "Account not found." };
  }

  if (accountRes.data.type === "credit_card") {
    return { balance: null, error: null };
  }

  const txRes = await supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount")
    .eq("household_id", householdId)
    .eq("is_non_cash", false)
    .or(`account_id.eq.${accountId},counterparty_account_id.eq.${accountId}`)
    .eq("status", "cleared");

  if (txRes.error) return { balance: null, error: txRes.error.message };

  let balance = Number(accountRes.data.opening_balance ?? 0);
  for (const row of txRes.data ?? []) {
    const amt = Number(row.amount ?? 0);
    if (row.type === "income" && row.account_id === accountId) balance += amt;
    if (row.type === "expense" && row.account_id === accountId) balance -= amt;
    if (row.type === "transfer") {
      if (row.account_id === accountId) balance -= amt;
      if (row.counterparty_account_id === accountId) balance += amt;
    }
  }
  return { balance, error: null };
}

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

  // 0. Pre-check: ensure source account has sufficient balance
  if (sourceAccountId) {
    const snap = await getAccountBalance(supabase, householdId, sourceAccountId);
    if (snap.error) return { status: "error", message: snap.error };
    if (snap.balance !== null && amount > snap.balance) {
      return { status: "error", message: "Insufficient funds in source account." };
    }
  }

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
    const liabilityRes = await supabase
      .from("liabilities")
      .select("current_principal_outstanding")
      .eq("id", liabilityId)
      .single();

    if (liabilityRes.error) {
      await supabase.from("liability_payments").delete().eq("id", paymentInsert.data.id);
      return { status: "error", message: `Failed to fetch liability: ${liabilityRes.error.message}` };
    }

    if (liabilityRes.data) {
      const newOutstanding = Math.max(
        0,
        Number(liabilityRes.data.current_principal_outstanding) - principal,
      );
      const updateRes = await supabase
        .from("liabilities")
        .update({ current_principal_outstanding: newOutstanding })
        .eq("id", liabilityId);
      if (updateRes.error) {
        await supabase.from("liability_payments").delete().eq("id", paymentInsert.data.id);
        return { status: "error", message: `Failed to update liability balance: ${updateRes.error.message}` };
      }
    }
  }

  // 3. If source account exists, create an expense transaction
  if (sourceAccountId) {
    const txInsert = await supabase.from("transactions").insert({
      household_id: householdId,
      account_id: sourceAccountId,
      type: "expense",
      amount: amount,
      transaction_date: paymentDate,
      description: `Debt payment for liability ${liabilityId}`,
      created_by: user.id,
    });
    if (txInsert.error) {
      await supabase.from("liability_payments").delete().eq("id", paymentInsert.data.id);
      return { status: "error", message: `Payment recorded but transaction failed: ${txInsert.error.message}` };
    }
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
