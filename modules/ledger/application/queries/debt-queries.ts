import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { LedgerRelation } from "../ledger-constants";
import {
  mapDebtPaymentRow,
  mapDebtRow,
  type Debt,
  type DebtPayment,
} from "../debt-domain";
import { DebtReadStatus } from "../debt-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

const DEBT_SELECT =
  "id, name, creditor, principal_amount, remaining_amount, opening_paid_amount, currency, direction, creation_mode, start_date, due_date, note, status, origin_account_id, origin_transaction_id, is_archived, financial_scope, owner_membership_id";

async function loadDebts(): Promise<Debt[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(DEBT_SELECT)
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false });
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_DEBTS, {
        householdId: gate.householdId,
      });
      return null;
    }
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      (data ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    return (data ?? []).map((row) =>
      mapDebtRow(row, gate.membershipId, activeOwnerMembershipIds ?? undefined),
    );
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_DEBTS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const listDebts = cache(loadDebts);

export type DebtReadResult =
  | { status: typeof DebtReadStatus.OK; debt: Debt }
  | { status: typeof DebtReadStatus.NOT_FOUND }
  | { status: typeof DebtReadStatus.ERROR };

export async function getDebtReadResult(
  debtId: string,
): Promise<DebtReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !debtId) {
    return { status: DebtReadStatus.ERROR };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(DEBT_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", debtId)
      .maybeSingle();
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_DEBT, {
        householdId: gate.householdId,
        debtId,
      });
      return { status: DebtReadStatus.ERROR };
    }
    if (data == null) {
      return { status: DebtReadStatus.NOT_FOUND };
    }
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      data.owner_membership_id ? [data.owner_membership_id] : [],
    );
    return {
      status: DebtReadStatus.OK,
      debt: mapDebtRow(
        data,
        gate.membershipId,
        activeOwnerMembershipIds ?? undefined,
      ),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_DEBT, {
      householdId: gate.householdId,
      debtId,
    });
    return { status: DebtReadStatus.ERROR };
  }
}

export async function getDebt(debtId: string): Promise<Debt | null> {
  const result = await getDebtReadResult(debtId);
  return result.status === DebtReadStatus.OK ? result.debt : null;
}

export type DebtPaymentsReadResult =
  | { status: typeof DebtReadStatus.OK; payments: DebtPayment[] }
  | { status: typeof DebtReadStatus.ERROR };

export async function listDebtPaymentsReadResult(
  debtId: string,
): Promise<DebtPaymentsReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !debtId) {
    return { status: DebtReadStatus.ERROR };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(LedgerRelation.DEBT_PAYMENTS)
      .select(
        "id, liability_id, account_id, transaction_id, amount, payment_direction, effective_date, note, accounts(name)",
      )
      .eq("household_id", gate.householdId)
      .eq("liability_id", debtId)
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_DEBT_PAYMENTS, {
        householdId: gate.householdId,
        debtId,
      });
      return { status: DebtReadStatus.ERROR };
    }
    return {
      status: DebtReadStatus.OK,
      payments: (data ?? []).map(mapDebtPaymentRow),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_DEBT_PAYMENTS, {
      householdId: gate.householdId,
      debtId,
    });
    return { status: DebtReadStatus.ERROR };
  }
}

export async function listDebtPayments(
  debtId: string,
): Promise<DebtPayment[] | null> {
  const result = await listDebtPaymentsReadResult(debtId);
  return result.status === DebtReadStatus.OK ? result.payments : null;
}
