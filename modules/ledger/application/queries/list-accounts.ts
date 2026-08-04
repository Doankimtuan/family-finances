import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { mapAccountRow, type LedgerAccount } from "../account-types";
import { applyTransactionDeltas } from "../transaction-types";
import {
  AccountType,
  DEFAULT_CURRENCY,
  TRANSACTION_BALANCE_STATUS_VALUES,
} from "../ledger-constants";

async function loadAccounts(options: {
  includeCreditCards: boolean;
}): Promise<{ currency: string; accounts: LedgerAccount[] } | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    let accountsQuery = supabase
      .from("accounts")
      .select("id, name, type, opening_balance, is_archived")
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (!options.includeCreditCards) {
      accountsQuery = accountsQuery.neq("type", AccountType.CREDIT_CARD);
    }

    const [{ data: household }, { data: rows, error }, { data: txRows }] =
      await Promise.all([
        supabase
          .from("households")
          .select("base_currency")
          .eq("id", gate.householdId)
          .maybeSingle(),
        accountsQuery,
        supabase
          .from("transactions")
          .select("account_id, type, amount")
          .eq("household_id", gate.householdId)
          .in("status", [...TRANSACTION_BALANCE_STATUS_VALUES]),
      ]);

    if (error) {
      return null;
    }

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      accounts: applyTransactionDeltas(
        (rows ?? []).map(mapAccountRow),
        (txRows ?? []).map((row) => ({
          accountId: row.account_id,
          type: row.type,
          amount: row.amount,
        })),
      ),
    };
  } catch {
    return null;
  }
}

/** Liquid wallets only — excludes credit cards (BR-01). */
export async function listAccounts(): Promise<{
  currency: string;
  accounts: LedgerAccount[];
} | null> {
  return loadAccounts({ includeCreditCards: false });
}

/** Capture picker — includes credit cards. */
export async function listAccountsForCapture(): Promise<{
  currency: string;
  accounts: LedgerAccount[];
} | null> {
  return loadAccounts({ includeCreditCards: true });
}

export async function getAccount(
  accountId: string,
): Promise<{ currency: string; account: LedgerAccount } | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !accountId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: row, error }, { data: txRows }] =
      await Promise.all([
        supabase
          .from("households")
          .select("base_currency")
          .eq("id", gate.householdId)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select("id, name, type, opening_balance, is_archived")
          .eq("household_id", gate.householdId)
          .eq("id", accountId)
          .maybeSingle(),
        supabase
          .from("transactions")
          .select("account_id, type, amount")
          .eq("household_id", gate.householdId)
          .eq("account_id", accountId)
          .in("status", [...TRANSACTION_BALANCE_STATUS_VALUES]),
      ]);

    if (error || !row || row.is_archived) {
      return null;
    }

    const [account] = applyTransactionDeltas(
      [mapAccountRow(row)],
      (txRows ?? []).map((tx) => ({
        accountId: tx.account_id,
        type: tx.type,
        amount: tx.amount,
      })),
    );

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      account,
    };
  } catch {
    return null;
  }
}
