import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { mapAccountRow, type RealPosition } from "../account-types";
import { applyTransactionDeltas } from "../transaction-types";
import {
  AccountType,
  ACCOUNT_TYPE_LIQUID_VALUES,
  DEFAULT_CURRENCY,
  TRANSACTION_BALANCE_STATUS_VALUES,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

/**
 * Real position = opening balances ± cleared ledger transactions (BR-01).
 * Credit cards are excluded — outstanding lives on the billing ledger.
 */
export async function getRealPosition(): Promise<RealPosition | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: rows, error }, { data: txRows }] =
      await Promise.all([
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
          .neq("type", AccountType.CREDIT_CARD)
          .order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("account_id, type, amount")
          .eq("household_id", gate.householdId)
          .in("status", [...TRANSACTION_BALANCE_STATUS_VALUES]),
      ]);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_REAL_POSITION, {
        householdId: gate.householdId,
      });
      return null;
    }

    const accounts = applyTransactionDeltas(
      (rows ?? []).map((row) => mapAccountRow(row, gate.membershipId)),
      (txRows ?? []).map((row) => ({
        accountId: row.account_id,
        type: row.type,
        amount: row.amount,
      })),
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
