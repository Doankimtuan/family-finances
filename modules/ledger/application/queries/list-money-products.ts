import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  LoanScheduleEntryStatus,
  type LedgerOperation,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  mapLiabilityRow,
  mapSavingsRow,
  mapLoanRow,
  mapLoanPaymentRow,
  mapLoanScheduleEntryRow,
  mapLoanInterestRatePeriodRow,
  type Liability,
  type SavingsProduct,
  type Loan,
  type LoanPayment,
  type LoanScheduleEntry,
  type LoanInterestRatePeriod,
} from "../money-product-types";

export async function listLiabilities(): Promise<Liability[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived",
      )
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_LIABILITIES, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map(mapLiabilityRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LIABILITIES, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export async function getLiability(
  liabilityId: string,
): Promise<Liability | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived",
      )
      .eq("household_id", gate.householdId)
      .eq("id", liabilityId)
      .maybeSingle();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_LIABILITY, {
        householdId: gate.householdId,
        liabilityId,
      });
      return null;
    }
    if (!data) return null;
    return mapLiabilityRow(data);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_LIABILITY, {
      householdId: gate.householdId,
      liabilityId,
    });
    return null;
  }
}

export async function listSavingsProducts(): Promise<SavingsProduct[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings_accounts")
      .select(
        "id, name, principal_amount, currency, maturity_date, status, note",
      )
      .eq("household_id", gate.householdId)
      .neq("status", "closed")
      .order("maturity_date", { ascending: true });

    if (error) return null;
    return (data ?? []).map(mapSavingsRow);
  } catch {
    return null;
  }
}

export async function getSavingsProduct(
  savingsId: string,
): Promise<SavingsProduct | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings_accounts")
      .select(
        "id, name, principal_amount, currency, maturity_date, status, note",
      )
      .eq("household_id", gate.householdId)
      .eq("id", savingsId)
      .maybeSingle();

    if (error || !data) return null;
    return mapSavingsRow(data);
  } catch {
    return null;
  }
}

const LOAN_SELECT =
  "id, name, lender, loan_type, principal, remaining_principal, annual_interest_rate, interest_strategy, promo_fixed_rate, promo_fixed_months, promo_floating_rate, promo_rate_effective_on, start_date, expected_end_date, first_payment_date, repayment_frequency, repayment_method, term_months, monthly_payment, total_interest, total_repayment, next_payment_date, currency, status, note, due_day";

async function loanAggregates(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  loanId: string,
  operation: LedgerOperation,
): Promise<{
  principalPaid: number;
  interestPaid: number;
  remainingPayments: number;
}> {
  const [
    { data: payments, error: paymentsError },
    { count, error: countError },
  ] = await Promise.all([
    supabase
      .from("loan_payments")
      .select("principal_paid, interest_paid")
      .eq("household_id", householdId)
      .eq("loan_id", loanId),
    supabase
      .from("loan_schedule_entries")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("loan_id", loanId)
      .eq("status", LoanScheduleEntryStatus.UPCOMING),
  ]);

  if (paymentsError || countError) {
    logLedgerFailure(paymentsError ?? countError, operation, {
      householdId,
      loanId,
    });
  }

  let principalPaid = 0;
  let interestPaid = 0;
  for (const row of payments ?? []) {
    principalPaid += Number(row.principal_paid);
    interestPaid += Number(row.interest_paid);
  }
  return {
    principalPaid,
    interestPaid,
    remainingPayments: count ?? 0,
  };
}

export async function listLoans(): Promise<Loan[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loans")
      .select(LOAN_SELECT)
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false });

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_LOANS, {
        householdId: gate.householdId,
      });
      return null;
    }
    return Promise.all(
      (data ?? []).map(async (row) => {
        const aggregates = await loanAggregates(
          supabase,
          gate.householdId,
          row.id,
          LEDGER_OPERATION.LIST_LOANS,
        );
        return mapLoanRow(row, aggregates);
      }),
    );
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOANS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/** @deprecated Use listLoans. */
export const listInstallmentPlans = listLoans;

export async function getLoan(loanId: string): Promise<Loan | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loans")
      .select(LOAN_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", loanId)
      .maybeSingle();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_LOAN, {
        householdId: gate.householdId,
        loanId,
      });
      return null;
    }
    if (!data) return null;
    const aggregates = await loanAggregates(
      supabase,
      gate.householdId,
      loanId,
      LEDGER_OPERATION.GET_LOAN,
    );
    return mapLoanRow(data, aggregates);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_LOAN, {
      householdId: gate.householdId,
      loanId,
    });
    return null;
  }
}

/** @deprecated Use getLoan. */
export const getInstallmentPlan = getLoan;

export async function listLoanPayments(
  loanId: string,
): Promise<LoanPayment[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loan_payments")
      .select(
        "id, loan_id, account_id, transaction_id, amount, principal_paid, interest_paid, paid_at",
      )
      .eq("household_id", gate.householdId)
      .eq("loan_id", loanId)
      .order("paid_at", { ascending: false });

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_PAYMENTS, {
        householdId: gate.householdId,
        loanId,
      });
      return null;
    }
    return (data ?? []).map(mapLoanPaymentRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_PAYMENTS, {
      householdId: gate.householdId,
      loanId,
    });
    return null;
  }
}

export async function listLoanSchedule(
  loanId: string,
): Promise<LoanScheduleEntry[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loan_schedule_entries")
      .select(
        "id, loan_id, sequence, due_date, principal_due, interest_due, total_due, remaining_balance_after, status, paid_at",
      )
      .eq("household_id", gate.householdId)
      .eq("loan_id", loanId)
      .order("sequence", { ascending: true });

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_SCHEDULE, {
        householdId: gate.householdId,
        loanId,
      });
      return null;
    }
    return (data ?? []).map(mapLoanScheduleEntryRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_SCHEDULE, {
      householdId: gate.householdId,
      loanId,
    });
    return null;
  }
}

/** Upcoming schedule rows for calendar projection (all active loans). */
export async function listUpcomingLoanScheduleEntries(): Promise<
  LoanScheduleEntry[] | null
> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loan_schedule_entries")
      .select(
        "id, loan_id, sequence, due_date, principal_due, interest_due, total_due, remaining_balance_after, status, paid_at",
      )
      .eq("household_id", gate.householdId)
      .eq("status", LoanScheduleEntryStatus.UPCOMING)
      .order("due_date", { ascending: true });

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_UPCOMING_LOAN_SCHEDULE, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map(mapLoanScheduleEntryRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_UPCOMING_LOAN_SCHEDULE, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export async function listLoanInterestRatePeriods(
  loanId: string,
): Promise<LoanInterestRatePeriod[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loan_interest_rate_periods")
      .select(
        "id, loan_id, sequence, effective_from, effective_to, annual_rate, kind, note, created_at",
      )
      .eq("household_id", gate.householdId)
      .eq("loan_id", loanId)
      .order("sequence", { ascending: true });

    if (error) {
      logLedgerFailure(
        error,
        LEDGER_OPERATION.LIST_LOAN_INTEREST_RATE_PERIODS,
        {
          householdId: gate.householdId,
          loanId,
        },
      );
      return null;
    }
    return (data ?? []).map(mapLoanInterestRatePeriodRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_INTEREST_RATE_PERIODS, {
      householdId: gate.householdId,
      loanId,
    });
    return null;
  }
}
