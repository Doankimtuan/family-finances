import type { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { LedgerRpcName } from "../ledger-shared-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type LedgerBalanceRpcRow = {
  account_id: string;
  balance: number | string;
};

export type HomeAccountLedgerRawInput = {
  account_id: string;
  account_name: string;
  account_type: string;
  opening_balance: number | string;
  is_archived: boolean;
  financial_scope: string | null;
  owner_membership_id: string | null;
  owner_membership_is_active: boolean;
  balance: number | string;
};

export async function loadAccountLedgerBalances(
  supabase: SupabaseServerClient,
  householdId: string,
  accountIds: string[],
): Promise<Map<string, number> | null> {
  if (accountIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.rpc(
    LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES,
    { p_account_ids: accountIds },
  );

  if (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_ACCOUNT_LEDGER_BALANCES, {
      householdId,
    });
    return null;
  }

  const balances = new Map<string, number>();
  for (const row of (data ?? []) as LedgerBalanceRpcRow[]) {
    const amount =
      typeof row.balance === "string"
        ? Number(row.balance)
        : Number(row.balance);
    if (!row.account_id || !Number.isFinite(amount)) {
      continue;
    }
    balances.set(row.account_id, amount);
  }
  return balances;
}

export async function loadHomeAccountLedgerRawInputs(
  supabase: SupabaseServerClient,
  householdId: string,
): Promise<HomeAccountLedgerRawInput[] | null> {
  const { data, error } = await supabase.rpc(
    LedgerRpcName.GET_HOME_ACCOUNT_LEDGER_RAW_INPUTS,
  );

  if (error) {
    logLedgerFailure(
      error,
      LEDGER_OPERATION.GET_HOME_ACCOUNT_LEDGER_RAW_INPUTS,
      {
        householdId,
      },
    );
    return null;
  }

  return (data ?? []) as HomeAccountLedgerRawInput[];
}

export function applyLedgerBalances<T extends { id: string; balance: number }>(
  accounts: T[],
  balances: Map<string, number>,
): T[] {
  return accounts.map((account) => {
    const balance = balances.get(account.id);
    if (balance == null) {
      return account;
    }
    return { ...account, balance };
  });
}
