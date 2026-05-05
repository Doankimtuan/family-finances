"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";
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

  if (!liabilityId) return fail("debt.error.missing_liability_id");
  if (amount <= 0) return fail("debt.error.amount_positive");
  if (principal + interest + fee > amount) {
    return fail("debt.error.sum_exceeds_total");
  }

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "debt.error.household_not_found");

  if (sourceAccountId) {
    const snap = await getAccountBalance(supabase, householdId, sourceAccountId);
    if (snap.error) return fail("debt.error.account_balance_failed");
    if (snap.balance !== null && amount > snap.balance) {
      return fail("debt.error.insufficient_funds");
    }
  }

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
    return fail("debt.error.payment_failed");

  if (principal > 0) {
    const liabilityRes = await supabase
      .from("liabilities")
      .select("current_principal_outstanding")
      .eq("id", liabilityId)
      .single();

    if (liabilityRes.error) {
      await supabase.from("liability_payments").delete().eq("id", paymentInsert.data.id);
      return fail("debt.error.liability_fetch_failed");
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
        return fail("debt.error.liability_update_failed");
      }
    }
  }

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
      return fail("debt.error.transaction_failed");
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

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${liabilityId}`);

  return ok(t("debt.success.payment_recorded"));
}
