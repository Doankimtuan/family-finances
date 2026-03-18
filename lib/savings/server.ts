import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function getSavingsApiContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
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
    throw new Error(membership.error?.message ?? "No household found.");
  }

  return {
    supabase,
    user,
    householdId: membership.data.household_id,
  };
}

export async function getSystemSavingsCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const result = await supabase
    .from("categories")
    .select("id, kind, name")
    .is("household_id", null)
    .in("name", [
      "Savings Deposit",
      "Savings Withdrawal",
      "Savings Interest",
      "Savings Tax",
      "Savings Penalty",
    ]);

  if (result.error) throw new Error(result.error.message);

  return new Map((result.data ?? []).map((row) => [row.name, row.id]));
}

export async function getAccountBalanceSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  accountId: string,
) {
  const accountRes = await supabase
    .from("accounts")
    .select("opening_balance, type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return {
      balance: null as number | null,
      error: accountRes.error?.message ?? "Account not found.",
    };
  }

  if (accountRes.data.type === "credit_card") {
    return { balance: null as number | null, error: null as string | null };
  }

  const txRes = await supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount, is_non_cash")
    .eq("household_id", householdId)
    .eq("is_non_cash", false)
    .or(`account_id.eq.${accountId},counterparty_account_id.eq.${accountId}`);

  if (txRes.error) {
    return { balance: null as number | null, error: txRes.error.message };
  }

  let balance = Number(accountRes.data.opening_balance ?? 0);
  for (const row of txRes.data ?? []) {
    const amount = Number(row.amount ?? 0);
    if (row.type === "income" && row.account_id === accountId) balance += amount;
    if (row.type === "expense" && row.account_id === accountId) balance -= amount;
    if (row.type === "transfer") {
      if (row.account_id === accountId) balance -= amount;
      if (row.counterparty_account_id === accountId) balance += amount;
    }
  }

  return { balance, error: null as string | null };
}

export async function insertSavingsTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    householdId: string;
    accountId: string;
    userId: string;
    type: "income" | "expense";
    amount: number;
    transactionDate: string;
    description: string;
    categoryId: string | null;
    subtype: string;
    relatedSavingsId: string;
    isNonCash?: boolean;
  },
) {
  const insert = await supabase
    .from("transactions")
    .insert({
      household_id: input.householdId,
      account_id: input.accountId,
      type: input.type,
      amount: Math.round(input.amount),
      currency: "VND",
      transaction_date: input.transactionDate,
      description: input.description,
      category_id: input.categoryId,
      paid_by_member_id: input.userId,
      status: "cleared",
      created_by: input.userId,
      transaction_subtype: input.subtype,
      related_savings_id: input.relatedSavingsId,
      is_non_cash: input.isNonCash ?? false,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) {
    throw new Error(insert.error?.message ?? "Failed to insert transaction.");
  }

  return insert.data.id;
}

export async function assertSavingsLinkedAccounts(
  supabase: SupabaseClient,
  householdId: string,
  accountIds: string[],
) {
  const uniqueIds = [...new Set(accountIds)];
  const result = await supabase
    .from("accounts")
    .select("id")
    .eq("household_id", householdId)
    .in("id", uniqueIds)
    .eq("is_archived", false);

  if (result.error) throw new Error(result.error.message);
  if ((result.data ?? []).length !== uniqueIds.length) {
    throw new Error("One or more linked accounts are invalid.");
  }
}
