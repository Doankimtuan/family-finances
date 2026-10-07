import { cache } from "react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { mapAccountRow, type LedgerAccount } from "../account-types";
import {
  ACCOUNT_OWNER_MEMBERSHIP_FK,
  ACCOUNT_TYPE_LIQUID_VALUES,
  DEFAULT_CURRENCY,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  applyLedgerBalances,
  loadAccountLedgerBalances,
} from "./load-account-ledger-balances";

const ACCOUNT_OWNER_MEMBERSHIP_EMBED = `owner_membership:household_members!${ACCOUNT_OWNER_MEMBERSHIP_FK}(id, household_id, is_active)`;

type AccountDetailContextRow = {
  id: string;
  name: string;
  type: string;
  icon_key: string | null;
  opening_balance: number | string;
  is_archived: boolean;
  financial_scope: string | null;
  owner_membership_id: string | null;
  owner_membership?: {
    id: unknown;
    household_id: unknown;
    is_active: unknown;
  } | null;
};

async function loadHouseholdCurrency(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
): Promise<string> {
  const { data: household } = await supabase
    .from("households")
    .select("base_currency")
    .eq("id", householdId)
    .maybeSingle();
  return (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase();
}

async function loadAccountOptions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  membershipId: string,
  options: { includeCreditCards: boolean },
): Promise<LedgerAccount[] | null> {
  let accountsQuery = supabase
    .from("accounts")
    .select(
      "id, name, type, icon_key, opening_balance, is_archived, financial_scope, owner_membership_id",
    )
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (!options.includeCreditCards) {
    accountsQuery = accountsQuery.in("type", [...ACCOUNT_TYPE_LIQUID_VALUES]);
  }

  const { data: rows, error } = await accountsQuery;
  if (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, { householdId });
    return null;
  }

  const accountRows = rows ?? [];
  const accountIds = accountRows.map((row) => row.id);
  const [activeOwnerMembershipIds, balances] = await Promise.all([
    listActiveMembershipIds(
      supabase,
      householdId,
      accountRows
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    ),
    loadAccountLedgerBalances(supabase, householdId, accountIds),
  ]);
  if (!balances) {
    return null;
  }

  return applyLedgerBalances(
    accountRows.map((row) =>
      mapAccountRow(row, membershipId, activeOwnerMembershipIds ?? undefined),
    ),
    balances,
  );
}

type CaptureAccountReferences = {
  currency: Promise<string>;
  accounts: Promise<LedgerAccount[] | null>;
};

function startAccountReads(options: {
  includeCreditCards: boolean;
}): CaptureAccountReferences {
  const reads = (async () => {
    const gate = await assertMoneyActionAllowed();
    if (!gate.ok) {
      return null;
    }

    try {
      const supabase = await createSupabaseServerClient();
      return {
        currency: loadHouseholdCurrency(supabase, gate.householdId).catch(
          (error: unknown) => {
            logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, {
              householdId: gate.householdId,
            });
            return DEFAULT_CURRENCY;
          },
        ),
        accounts: loadAccountOptions(
          supabase,
          gate.householdId,
          gate.membershipId,
          options,
        ).catch((error: unknown) => {
          logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, {
            householdId: gate.householdId,
          });
          return null;
        }),
      };
    } catch (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_ACCOUNTS, {
        householdId: gate.householdId,
      });
      return null;
    }
  })();

  return {
    currency: reads.then((result) => result?.currency ?? DEFAULT_CURRENCY),
    accounts: reads.then((result) => result?.accounts ?? null),
  };
}

async function loadAccounts(options: {
  includeCreditCards: boolean;
}): Promise<{ currency: string; accounts: LedgerAccount[] } | null> {
  const reads = startAccountReads(options);
  const [currency, accounts] = await Promise.all([
    reads.currency,
    reads.accounts,
  ]);
  return accounts ? { currency, accounts } : null;
}

/** Liquid wallets only — excludes credit cards and internal products (BR-01). */
async function loadLiquidAccounts(): Promise<{
  currency: string;
  accounts: LedgerAccount[];
} | null> {
  return loadAccounts({ includeCreditCards: false });
}

export const listAccounts = cache(loadLiquidAccounts);

/** Start capture currency and account references together for progressive rendering. */
export function listCaptureAccountReferences(): CaptureAccountReferences {
  return startAccountReads({ includeCreditCards: true });
}

/** Capture picker — includes credit cards. */
export async function listAccountsForCapture(): Promise<{
  currency: string;
  accounts: LedgerAccount[];
} | null> {
  return loadAccounts({ includeCreditCards: true });
}

const loadAccountDetailContext = cache(async (accountId: string) => {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !accountId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household, error: householdError }, { data: row, error }] =
      await Promise.all([
        supabase
          .from("households")
          .select("base_currency")
          .eq("id", gate.householdId)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select(
            `id, name, type, icon_key, opening_balance, is_archived, financial_scope, owner_membership_id, ${ACCOUNT_OWNER_MEMBERSHIP_EMBED}`,
          )
          .eq("household_id", gate.householdId)
          .eq("id", accountId)
          .maybeSingle()
          .overrideTypes<AccountDetailContextRow, { merge: false }>(),
      ]);

    if (error || householdError) {
      logLedgerFailure(error ?? householdError, LEDGER_OPERATION.GET_ACCOUNT, {
        householdId: gate.householdId,
        accountId,
      });
      return null;
    }

    if (!row || row.is_archived) {
      return null;
    }

    return { gate, household, row };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_ACCOUNT, {
      householdId: gate.householdId,
      accountId,
    });
    return null;
  }
});

export async function getAccountType(
  accountId: string,
): Promise<LedgerAccount["type"] | null> {
  const context = await loadAccountDetailContext(accountId);
  if (!context) {
    return null;
  }

  return mapAccountRow(context.row, context.gate.membershipId).type;
}

async function loadSelectedAccountBalances(accountId: string) {
  let householdId: string | undefined;
  try {
    const gate = await assertMoneyActionAllowed();
    if (!gate.ok) {
      return null;
    }

    householdId = gate.householdId;
    const supabase = await createSupabaseServerClient();
    return await loadAccountLedgerBalances(supabase, householdId, [accountId]);
  } catch (error) {
    logLedgerFailure(
      error,
      LEDGER_OPERATION.GET_ACCOUNT,
      householdId ? { householdId } : {},
    );
    return null;
  }
}

export async function getAccount(
  accountId: string,
): Promise<{ currency: string; account: LedgerAccount } | null> {
  if (!z.string().uuid().safeParse(accountId).success) {
    return null;
  }

  const balancesPromise = loadSelectedAccountBalances(accountId);
  const context = await loadAccountDetailContext(accountId);
  if (!context) {
    return null;
  }

  const { gate, household, row } = context;
  try {
    const owner = row.owner_membership;
    const activeOwnerMembershipIds = new Set<string>();
    if (
      typeof owner?.id === "string" &&
      owner.id === row.owner_membership_id &&
      owner.household_id === gate.householdId &&
      owner.is_active === true
    ) {
      activeOwnerMembershipIds.add(owner.id);
    }

    const balances = await balancesPromise;
    if (!balances) {
      return null;
    }

    const [account] = applyLedgerBalances(
      [mapAccountRow(row, gate.membershipId, activeOwnerMembershipIds)],
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
