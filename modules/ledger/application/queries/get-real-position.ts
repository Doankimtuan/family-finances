import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { mapAccountRow, type RealPosition } from "../account-types";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  DEFAULT_CURRENCY,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  applyLedgerBalances,
  loadAccountLedgerBalances,
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
    const [{ data: household }, { data: rows, error }] = await Promise.all([
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
        .eq("is_archived", false)
        .in("type", [...ACCOUNT_TYPE_LIQUID_VALUES])
        .order("created_at", { ascending: true }),
    ]);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_REAL_POSITION, {
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

    const accounts = applyLedgerBalances(
      (rows ?? []).map((row) =>
        mapAccountRow(
          row,
          gate.membershipId,
          activeOwnerMembershipIds ?? undefined,
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
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
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
