import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { LedgerRelation } from "../ledger-constants";
import {
  mapDebtPaymentRow,
  mapDebtRow,
  type Debt,
  type DebtPayment,
} from "../debt-domain";

const DEBT_SELECT =
  "id, name, creditor, principal_amount, remaining_amount, currency, direction, creation_mode, start_date, due_date, note, status, origin_account_id, origin_transaction_id, is_archived";

export async function listDebts(): Promise<Debt[] | null> {
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
      return null;
    }
    return (data ?? []).map(mapDebtRow);
  } catch {
    return null;
  }
}

export async function getDebt(debtId: string): Promise<Debt | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !debtId) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(DEBT_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", debtId)
      .maybeSingle();
    if (error || data == null) {
      return null;
    }
    return mapDebtRow(data);
  } catch {
    return null;
  }
}

export async function listDebtPayments(
  debtId: string,
): Promise<DebtPayment[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !debtId) {
    return null;
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
      return null;
    }
    return (data ?? []).map(mapDebtPaymentRow);
  } catch {
    return null;
  }
}
