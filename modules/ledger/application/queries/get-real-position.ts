import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getHomeHouseholdContext } from "@/modules/tenancy/application/get-home-household-context";
import { mapAccountRow, type RealPosition } from "../account-types";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  DEFAULT_CURRENCY,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  applyLedgerBalances,
  loadHomeAccountLedgerRawInputs,
} from "./load-account-ledger-balances";

/**
 * Real position = opening balances ± cleared ledger transactions (BR-01).
 * Credit cards are excluded — outstanding lives on the billing ledger.
 *
 * Request-local only via React `cache()`. One household per request (the
 * gated session). Not a cross-request financial cache.
 */
async function loadRealPosition(): Promise<RealPosition | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const householdPromise = getHomeHouseholdContext();
    const [rows, householdContext] = await Promise.all([
      loadHomeAccountLedgerRawInputs(supabase, gate.householdId),
      householdPromise,
    ]);
    if (!rows) {
      return null;
    }

    const activeOwnerMembershipIds = new Set(
      rows
        .filter(
          (row) =>
            row.owner_membership_id != null && row.owner_membership_is_active,
        )
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    const balances = new Map(
      rows
        .map(
          (row) =>
            [
              row.account_id,
              typeof row.balance === "string"
                ? Number(row.balance)
                : row.balance,
            ] as const,
        )
        .filter(([, balance]) => Number.isFinite(balance)),
    );
    const accounts = applyLedgerBalances(
      rows.map((row) =>
        mapAccountRow(
          {
            id: row.account_id,
            name: row.account_name,
            type: row.account_type,
            opening_balance: row.opening_balance,
            is_archived: row.is_archived,
            financial_scope: row.financial_scope,
            owner_membership_id: row.owner_membership_id,
          },
          gate.membershipId,
          activeOwnerMembershipIds,
        ),
      ),
      balances,
    ).filter((account) =>
      ACCOUNT_TYPE_LIQUID_VALUES.some((type) => type === account.type),
    );
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );

    return {
      householdId: gate.householdId,
      currency: (
        householdContext?.baseCurrency ?? DEFAULT_CURRENCY
      ).toUpperCase(),
      totalBalance,
      accounts,
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_REAL_POSITION, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const getRealPosition = cache(loadRealPosition);
