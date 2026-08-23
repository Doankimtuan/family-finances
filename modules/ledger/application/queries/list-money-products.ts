import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import {
  LoanReadStatus,
  LoanScheduleEntryStatus,
  type LedgerOperation,
} from "../ledger-constants";
import {
  LOAN_STATUS_VALUES,
  LoanStatus,
  type LoanStatus as LoanStatusValue,
} from "../loan-constants";
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
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived, financial_scope, owner_membership_id",
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
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      (data ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    return (data ?? []).map((row) =>
      mapLiabilityRow(
        row,
        gate.membershipId,
        activeOwnerMembershipIds ?? undefined,
      ),
    );
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
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived, financial_scope, owner_membership_id",
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
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      data.owner_membership_id ? [data.owner_membership_id] : [],
    );
    return mapLiabilityRow(
      data,
      gate.membershipId,
      activeOwnerMembershipIds ?? undefined,
    );
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

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_SAVINGS_PRODUCTS, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map(mapSavingsRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_SAVINGS_PRODUCTS, {
      householdId: gate.householdId,
    });
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

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_SAVINGS_PRODUCT, {
        householdId: gate.householdId,
        savingsId,
      });
      return null;
    }
    if (!data) return null;
    return mapSavingsRow(data);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_SAVINGS_PRODUCT, {
      householdId: gate.householdId,
      savingsId,
    });
    return null;
  }
}

const LOAN_SELECT =
  "id, name, lender, loan_type, principal, remaining_principal, annual_interest_rate, interest_strategy, promo_fixed_rate, promo_fixed_months, promo_floating_rate, promo_rate_effective_on, start_date, expected_end_date, first_payment_date, repayment_frequency, repayment_method, term_months, monthly_payment, total_interest, total_repayment, next_payment_date, currency, status, note, due_day, financial_scope, owner_membership_id";

async function loanAggregates(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  loanId: string,
  operation: LedgerOperation,
): Promise<{
  principalPaid: number;
  interestPaid: number;
  remainingPayments: number;
  nextPaymentAmount: number | null;
}> {
  const [
    { data: payments, error: paymentsError },
    { count, error: countError },
    { data: nextSchedule, error: nextScheduleError },
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
    supabase
      .from("loan_schedule_entries")
      .select("total_due")
      .eq("household_id", householdId)
      .eq("loan_id", loanId)
      .eq("status", LoanScheduleEntryStatus.UPCOMING)
      .order("sequence", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (paymentsError || countError || nextScheduleError) {
    logLedgerFailure(
      paymentsError ?? countError ?? nextScheduleError,
      operation,
      {
        householdId,
        loanId,
      },
    );
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
    nextPaymentAmount:
      nextSchedule?.total_due == null ? null : Number(nextSchedule.total_due),
  };
}

async function loadLoans(): Promise<Loan[] | null> {
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
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      (data ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    return Promise.all(
      (data ?? []).map(async (row) => {
        const aggregates = await loanAggregates(
          supabase,
          gate.householdId,
          row.id,
          LEDGER_OPERATION.LIST_LOANS,
        );
        return mapLoanRow(
          row,
          aggregates,
          gate.membershipId,
          activeOwnerMembershipIds ?? undefined,
        );
      }),
    );
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOANS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const listLoans = cache(loadLoans);

/** @deprecated Use listLoans. */
export const listInstallmentPlans = listLoans;

/**
 * Light loan read for hub-level summaries: stored columns only, no per-loan
 * payment/schedule aggregates. `listLoans` stays the full product read.
 */
export type LoanSummaryRow = {
  remainingPrincipal: number;
  nextPaymentDate: string | null;
  status: LoanStatusValue;
  currency: string;
};

const LOAN_SUMMARY_SELECT =
  "remaining_principal, next_payment_date, status, currency";

async function loadLoanSummaries(): Promise<LoanSummaryRow[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loans")
      .select(LOAN_SUMMARY_SELECT)
      .eq("household_id", gate.householdId);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_LOANS, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map((row) => ({
      remainingPrincipal: Number(row.remaining_principal ?? 0),
      nextPaymentDate: row.next_payment_date ?? null,
      status: isLoanStatus(row.status) ? row.status : LoanStatus.ACTIVE,
      currency: row.currency,
    }));
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOANS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

function isLoanStatus(value: unknown): value is LoanStatusValue {
  return (
    typeof value === "string" &&
    (LOAN_STATUS_VALUES as readonly string[]).includes(value)
  );
}

export const listLoanSummaries = cache(loadLoanSummaries);

export async function getLoan(loanId: string): Promise<Loan | null> {
  const result = await getLoanReadResult(loanId);
  return result.status === LoanReadStatus.OK ? result.loan : null;
}

export type LoanReadResult =
  | { status: typeof LoanReadStatus.OK; loan: Loan }
  | { status: typeof LoanReadStatus.NOT_FOUND }
  | { status: typeof LoanReadStatus.ERROR };

export async function getLoanReadResult(
  loanId: string,
): Promise<LoanReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !loanId) return { status: LoanReadStatus.ERROR };

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
      return { status: LoanReadStatus.ERROR };
    }
    if (!data) return { status: LoanReadStatus.NOT_FOUND };
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      data.owner_membership_id ? [data.owner_membership_id] : [],
    );
    const aggregates = await loanAggregates(
      supabase,
      gate.householdId,
      loanId,
      LEDGER_OPERATION.GET_LOAN,
    );
    return {
      status: LoanReadStatus.OK,
      loan: mapLoanRow(
        data,
        aggregates,
        gate.membershipId,
        activeOwnerMembershipIds ?? undefined,
      ),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_LOAN, {
      householdId: gate.householdId,
      loanId,
    });
    return { status: LoanReadStatus.ERROR };
  }
}

/** @deprecated Use getLoan. */
export const getInstallmentPlan = getLoan;

export async function listLoanPayments(
  loanId: string,
): Promise<LoanPayment[] | null> {
  const result = await listLoanPaymentsReadResult(loanId);
  return result.status === LoanReadStatus.OK ? result.payments : null;
}

export type LoanPaymentsReadResult =
  | { status: typeof LoanReadStatus.OK; payments: LoanPayment[] }
  | { status: typeof LoanReadStatus.ERROR };

export async function listLoanPaymentsReadResult(
  loanId: string,
): Promise<LoanPaymentsReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !loanId) return { status: LoanReadStatus.ERROR };

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
      return { status: LoanReadStatus.ERROR };
    }
    return {
      status: LoanReadStatus.OK,
      payments: (data ?? []).map(mapLoanPaymentRow),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_PAYMENTS, {
      householdId: gate.householdId,
      loanId,
    });
    return { status: LoanReadStatus.ERROR };
  }
}

export async function listLoanSchedule(
  loanId: string,
): Promise<LoanScheduleEntry[] | null> {
  const result = await listLoanScheduleReadResult(loanId);
  return result.status === LoanReadStatus.OK ? result.schedule : null;
}

export type LoanScheduleReadResult =
  | { status: typeof LoanReadStatus.OK; schedule: LoanScheduleEntry[] }
  | { status: typeof LoanReadStatus.ERROR };

export async function listLoanScheduleReadResult(
  loanId: string,
): Promise<LoanScheduleReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !loanId) return { status: LoanReadStatus.ERROR };

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
      return { status: LoanReadStatus.ERROR };
    }
    return {
      status: LoanReadStatus.OK,
      schedule: (data ?? []).map(mapLoanScheduleEntryRow),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_SCHEDULE, {
      householdId: gate.householdId,
      loanId,
    });
    return { status: LoanReadStatus.ERROR };
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

export type LoanInterestRatePeriodsReadResult =
  | { status: typeof LoanReadStatus.OK; periods: LoanInterestRatePeriod[] }
  | { status: typeof LoanReadStatus.ERROR };

export async function listLoanInterestRatePeriodsReadResult(
  loanId: string,
): Promise<LoanInterestRatePeriodsReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !loanId) return { status: LoanReadStatus.ERROR };

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
      return { status: LoanReadStatus.ERROR };
    }
    return {
      status: LoanReadStatus.OK,
      periods: (data ?? []).map(mapLoanInterestRatePeriodRow),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_LOAN_INTEREST_RATE_PERIODS, {
      householdId: gate.householdId,
      loanId,
    });
    return { status: LoanReadStatus.ERROR };
  }
}

/** @deprecated Use listLoanInterestRatePeriodsReadResult. */
export async function listLoanInterestRatePeriods(
  loanId: string,
): Promise<LoanInterestRatePeriod[] | null> {
  const result = await listLoanInterestRatePeriodsReadResult(loanId);
  return result.status === LoanReadStatus.OK ? result.periods : null;
}
