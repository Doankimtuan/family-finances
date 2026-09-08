import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { mapAccountRow, type LedgerAccount } from "../account-types";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  DEFAULT_CURRENCY,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  applyLedgerBalances,
  loadAccountLedgerBalances,
} from "./load-account-ledger-balances";

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
      .select(
        "id, name, type, opening_balance, is_archived, financial_scope, owner_membership_id",
      )
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (!options.includeCreditCards) {
      accountsQuery = accountsQuery.in("type", [...ACCOUNT_TYPE_LIQUID_VALUES]);
    }

    const [{ data: household }, { data: rows, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      accountsQuery,
    ]);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, {
        householdId: gate.householdId,
      });
      return null;
    }

    const accountIds = (rows ?? []).map((row) => row.id);
    const [activeOwnerMembershipIds, balances] = await Promise.all([
      listActiveMembershipIds(
        supabase,
        gate.householdId,
        (rows ?? [])
          .map((row) => row.owner_membership_id)
          .filter((id): id is string => id != null),
      ),
      loadAccountLedgerBalances(supabase, gate.householdId, accountIds),
    ]);
    if (!balances) {
      return null;
    }

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      accounts: applyLedgerBalances(
        (rows ?? []).map((row) =>
          mapAccountRow(
            row,
            gate.membershipId,
            activeOwnerMembershipIds ?? undefined,
          ),
        ),
        balances,
      ),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/** Liquid wallets only — excludes credit cards and internal products (BR-01). */
async function loadLiquidAccounts(): Promise<{
  currency: string;
  accounts: LedgerAccount[];
} | null> {
  return loadAccounts({ includeCreditCards: false });
}

export const listAccounts = cache(loadLiquidAccounts);

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
    const [{ data: household }, { data: row, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select(
          "id, name, type, opening_balance, is_archived, financial_scope, owner_membership_id",
        )
        .eq("household_id", gate.householdId)
        .eq("id", accountId)
        .maybeSingle(),
    ]);

    if (error || !row || row.is_archived) {
      return null;
    }

    const [activeOwnerMembershipIds, balances] = await Promise.all([
      listActiveMembershipIds(
        supabase,
        gate.householdId,
        row.owner_membership_id ? [row.owner_membership_id] : [],
      ),
      loadAccountLedgerBalances(supabase, gate.householdId, [accountId]),
    ]);
    if (!balances) {
      return null;
    }

    const [account] = applyLedgerBalances(
      [
        mapAccountRow(
          row,
          gate.membershipId,
          activeOwnerMembershipIds ?? undefined,
        ),
      ],
      balances,
    );

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      account,
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_ACCOUNT, {
      householdId: gate.householdId,
      accountId,
    });
    return null;
  }
}
