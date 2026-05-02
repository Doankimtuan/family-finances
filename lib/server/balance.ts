/**
 * Canonical account balance snapshot calculation.
 *
 * Computes the real-time balance of an account by summing the opening
 * balance with all cleared, non-cash transactions.
 *
 * Previously duplicated in:
 *   - app/transactions/actions.ts
 *   - app/assets/cashflow-actions.ts
 *   - (inline) app/money/page.tsx
 */
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type BalanceResult =
  | { balance: number; error: null }
  | { balance: null; error: string }
  | { balance: null; error: null };

/**
 * Returns the current cleared balance of `accountId` within `householdId`.
 * Considers income, expense, and transfer transactions that are cleared and cash-based.
 */
export async function getAccountBalanceSnapshot(
  supabase: SupabaseClient,
  householdId: string,
  accountId: string,
  excludeTransactionId?: string,
): Promise<BalanceResult> {
  const accountRes = await supabase
    .from("accounts")
    .select("opening_balance, type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();

  if (accountRes.error || !accountRes.data) {
    return {
      balance: null,
      error: accountRes.error?.message ?? "Account not found.",
    };
  }

  // Credit cards operate on credit limit, not a deposited balance.
  // We skip the balance check — spending is always allowed up to the credit limit.
  // The credit limit constraint is handled separately through card_billing_months.
  if (accountRes.data.type === "credit_card") {
    return { balance: null, error: null };
  }

  let txQuery = supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount")
    .eq("household_id", householdId)
    .eq("is_non_cash", false)
    .or(`account_id.eq.${accountId},counterparty_account_id.eq.${accountId}`)
    .eq("status", "cleared");

  if (excludeTransactionId) {
    txQuery = txQuery.neq("id", excludeTransactionId);
  }

  const txRes = await txQuery;

  if (txRes.error) {
    return { balance: null, error: txRes.error.message };
  }

  let balance = Number(accountRes.data.opening_balance ?? 0);
  for (const row of txRes.data ?? []) {
    const amount = Number(row.amount ?? 0);
    if (row.type === "income" && row.account_id === accountId) balance += amount;
    if (row.type === "expense" && row.account_id === accountId)
      balance -= amount;
    if (row.type === "transfer") {
      if (row.account_id === accountId) balance -= amount;
      if (row.counterparty_account_id === accountId) balance += amount;
    }
  }

  return { balance, error: null };
}
