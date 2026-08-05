/**
 * Debts / savings / loans domain types (ST-E04-004 + Loan domain evolution).
 * Owed and product amounts are never unlabeled bank Balance (BR-01).
 */

import {
  LoanInterestStrategy,
  LoanInterestRatePeriodKind,
  LoanRepaymentFrequency,
  LoanRepaymentMethod,
  LoanScheduleEntryStatus,
  LoanStatus,
  LoanType,
  LOAN_INTEREST_STRATEGY_VALUES,
  LOAN_INTEREST_RATE_PERIOD_KIND_VALUES,
  LOAN_REPAYMENT_METHOD_VALUES,
  LOAN_SCHEDULE_ENTRY_STATUS_VALUES,
  LOAN_STATUS_VALUES,
  LOAN_TYPE_VALUES,
  type LoanInterestStrategy as LoanInterestStrategyValue,
  type LoanInterestRatePeriodKind as LoanInterestRatePeriodKindValue,
  type LoanRepaymentFrequency as LoanRepaymentFrequencyValue,
  type LoanRepaymentMethod as LoanRepaymentMethodValue,
  type LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
  type LoanStatus as LoanStatusValue,
  type LoanType as LoanTypeValue,
} from "./ledger-constants";

export const LiabilityStatus = {
  OPEN: "open",
  PAID: "paid",
} as const;

export type LiabilityStatus =
  (typeof LiabilityStatus)[keyof typeof LiabilityStatus];

export type Liability = {
  id: string;
  name: string;
  creditor: string | null;
  principalAmount: number;
  remainingAmount: number;
  currency: string;
  dueDay: number | null;
  note: string | null;
  isArchived: boolean;
  status: LiabilityStatus;
};

export const SavingsProductStatus = {
  ACTIVE: "active",
  MATURED: "matured",
  CLOSED: "closed",
} as const;

export type SavingsProductStatus =
  (typeof SavingsProductStatus)[keyof typeof SavingsProductStatus];

export type SavingsProduct = {
  id: string;
  name: string;
  principalAmount: number;
  currency: string;
  maturityDate: string;
  status: SavingsProductStatus;
  note: string | null;
  isMaturityDue: boolean;
};

/** @deprecated Use LoanStatus — retained alias for transitional imports. */
export { LoanStatus };
export const InstallmentPlanStatus = LoanStatus;
/** @deprecated Use LoanStatus. */
export type InstallmentPlanStatus = LoanStatusValue;

export type Loan = {
  id: string;
  name: string;
  lender: string | null;
  loanType: LoanTypeValue;
  principal: number;
  remainingPrincipal: number;
  annualInterestRate: number | null;
  interestStrategy: LoanInterestStrategyValue;
  promoFixedRate: number | null;
  promoFixedMonths: number | null;
  promoFloatingRate: number | null;
  promoRateEffectiveOn: string | null;
  startDate: string;
  expectedEndDate: string | null;
  firstPaymentDate: string | null;
  repaymentFrequency: LoanRepaymentFrequencyValue;
  repaymentMethod: LoanRepaymentMethodValue;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  nextPaymentDate: string | null;
  currency: string;
  status: LoanStatusValue;
  note: string | null;
  /** Day-of-month for calendar projection. */
  dueDay: number;
  /** 0–1 principal progress. */
  progress: number;
  /** Remaining upcoming schedule periods (from remainingPaymentsHint or ceil). */
  remainingPayments: number;
  principalPaid: number;
  interestPaid: number;
};

/** @deprecated Use Loan. */
export type InstallmentPlan = Loan;

export type LoanPayment = {
  id: string;
  loanId: string;
  accountId: string;
  transactionId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  paidAt: string;
};

export type LoanScheduleEntry = {
  id: string;
  loanId: string;
  sequence: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  remainingBalanceAfter: number;
  status: LoanScheduleEntryStatusValue;
  paidAt: string | null;
};

export type LoanInterestRatePeriod = {
  id: string;
  loanId: string;
  sequence: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  annualRate: number;
  kind: LoanInterestRatePeriodKindValue;
  note: string | null;
  createdAt: string;
};

export function mapLiabilityRow(row: {
  id: string;
  name: string;
  creditor: string | null;
  principal_amount: number | string;
  remaining_amount: number | string;
  currency: string;
  due_day: number | null;
  note: string | null;
  is_archived: boolean;
}): Liability {
  const remaining =
    typeof row.remaining_amount === "string"
      ? Number(row.remaining_amount)
      : Number(row.remaining_amount);
  return {
    id: row.id,
    name: row.name,
    creditor: row.creditor,
    principalAmount:
      typeof row.principal_amount === "string"
        ? Number(row.principal_amount)
        : Number(row.principal_amount),
    remainingAmount: remaining,
    currency: row.currency.toUpperCase(),
    dueDay: row.due_day,
    note: row.note,
    isArchived: row.is_archived,
    status:
      remaining <= 0 || row.is_archived
        ? LiabilityStatus.PAID
        : LiabilityStatus.OPEN,
  };
}

export function mapSavingsRow(row: {
  id: string;
  name: string;
  principal_amount: number | string;
  currency: string;
  maturity_date: string;
  status: string;
  note: string | null;
}): SavingsProduct {
  const status =
    row.status === SavingsProductStatus.MATURED
      ? SavingsProductStatus.MATURED
      : row.status === SavingsProductStatus.CLOSED
        ? SavingsProductStatus.CLOSED
        : SavingsProductStatus.ACTIVE;
  const maturityDate = row.maturity_date;
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    name: row.name,
    principalAmount:
      typeof row.principal_amount === "string"
        ? Number(row.principal_amount)
        : Number(row.principal_amount),
    currency: row.currency.toUpperCase(),
    maturityDate,
    status,
    note: row.note,
    isMaturityDue:
      status === SavingsProductStatus.ACTIVE && maturityDate <= today,
  };
}

export function mapLoanRow(
  row: {
    id: string;
    name: string;
    lender: string | null;
    loan_type: string;
    principal: number | string;
    remaining_principal: number | string;
    annual_interest_rate: number | string | null;
    interest_strategy?: string | null;
    promo_fixed_rate?: number | string | null;
    promo_fixed_months?: number | null;
    promo_floating_rate?: number | string | null;
    promo_rate_effective_on?: string | null;
    start_date: string;
    expected_end_date: string | null;
    first_payment_date?: string | null;
    repayment_frequency: string;
    repayment_method?: string | null;
    term_months?: number | null;
    monthly_payment: number | string;
    total_interest?: number | string | null;
    total_repayment?: number | string | null;
    next_payment_date: string | null;
    currency: string;
    status: string;
    note: string | null;
    due_day?: number | null;
  },
  aggregates?: {
    principalPaid?: number;
    interestPaid?: number;
    remainingPayments?: number;
  },
): Loan {
  const principal =
    typeof row.principal === "string"
      ? Number(row.principal)
      : Number(row.principal);
  const remaining =
    typeof row.remaining_principal === "string"
      ? Number(row.remaining_principal)
      : Number(row.remaining_principal);
  const monthlyPayment =
    typeof row.monthly_payment === "string"
      ? Number(row.monthly_payment)
      : Number(row.monthly_payment);
  const rateRaw = row.annual_interest_rate;
  const annualInterestRate =
    rateRaw == null
      ? null
      : typeof rateRaw === "string"
        ? Number(rateRaw)
        : Number(rateRaw);
  const statusValue = row.status;
  let status = (LOAN_STATUS_VALUES as readonly string[]).includes(statusValue)
    ? (statusValue as LoanStatusValue)
    : remaining <= 0
      ? LoanStatus.COMPLETED
      : LoanStatus.ACTIVE;
  if (remaining <= 0 && status === LoanStatus.ACTIVE) {
    status = LoanStatus.COMPLETED;
  }
  const dueDay = Number(row.due_day);
  const remainingPayments =
    aggregates?.remainingPayments ??
    (monthlyPayment > 0
      ? Math.ceil(Math.max(0, remaining) / monthlyPayment)
      : 0);
  const progress =
    principal > 0
      ? Math.min(1, Math.max(0, (principal - remaining) / principal))
      : 0;
  const loanType = (LOAN_TYPE_VALUES as readonly string[]).includes(
    row.loan_type,
  )
    ? (row.loan_type as LoanTypeValue)
    : LoanType.OTHER;
  const methodRaw = row.repayment_method ?? LoanRepaymentMethod.FIXED_MONTHLY;
  const repaymentMethod = (
    LOAN_REPAYMENT_METHOD_VALUES as readonly string[]
  ).includes(methodRaw)
    ? (methodRaw as LoanRepaymentMethodValue)
    : LoanRepaymentMethod.FIXED_MONTHLY;
  const strategyRaw = row.interest_strategy ?? LoanInterestStrategy.FIXED;
  const interestStrategy = (
    LOAN_INTEREST_STRATEGY_VALUES as readonly string[]
  ).includes(strategyRaw)
    ? (strategyRaw as LoanInterestStrategyValue)
    : LoanInterestStrategy.FIXED;
  const totalInterest =
    row.total_interest == null
      ? 0
      : typeof row.total_interest === "string"
        ? Number(row.total_interest)
        : Number(row.total_interest);
  const totalRepayment =
    row.total_repayment == null
      ? principal + totalInterest
      : typeof row.total_repayment === "string"
        ? Number(row.total_repayment)
        : Number(row.total_repayment);
  const numOrNull = (v: number | string | null | undefined): number | null => {
    if (v == null) return null;
    const n = typeof v === "string" ? Number(v) : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: row.id,
    name: row.name,
    lender: row.lender,
    loanType,
    principal,
    remainingPrincipal: Math.max(0, remaining),
    annualInterestRate:
      annualInterestRate != null && Number.isFinite(annualInterestRate)
        ? annualInterestRate
        : null,
    interestStrategy,
    promoFixedRate: numOrNull(row.promo_fixed_rate),
    promoFixedMonths:
      row.promo_fixed_months != null && Number(row.promo_fixed_months) > 0
        ? Number(row.promo_fixed_months)
        : null,
    promoFloatingRate: numOrNull(row.promo_floating_rate),
    promoRateEffectiveOn: row.promo_rate_effective_on ?? null,
    startDate: row.start_date,
    expectedEndDate: row.expected_end_date,
    firstPaymentDate: row.first_payment_date ?? null,
    repaymentFrequency: LoanRepaymentFrequency.MONTHLY,
    repaymentMethod,
    termMonths:
      Number(row.term_months) > 0
        ? Number(row.term_months)
        : remainingPayments || 1,
    monthlyPayment,
    totalInterest,
    totalRepayment,
    nextPaymentDate: row.next_payment_date,
    currency: row.currency.toUpperCase(),
    status,
    note: row.note,
    dueDay: Number.isFinite(dueDay) && dueDay >= 1 && dueDay <= 31 ? dueDay : 1,
    progress,
    remainingPayments,
    principalPaid:
      aggregates?.principalPaid ?? Math.max(0, principal - remaining),
    interestPaid: aggregates?.interestPaid ?? 0,
  };
}

/** @deprecated Use mapLoanRow. */
export const mapInstallmentRow = mapLoanRow;

export function mapLoanPaymentRow(row: {
  id: string;
  loan_id: string;
  account_id: string;
  transaction_id: string;
  amount: number | string;
  principal_paid: number | string;
  interest_paid: number | string;
  paid_at: string;
}): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    accountId: row.account_id,
    transactionId: row.transaction_id,
    amount:
      typeof row.amount === "string" ? Number(row.amount) : Number(row.amount),
    principalPaid:
      typeof row.principal_paid === "string"
        ? Number(row.principal_paid)
        : Number(row.principal_paid),
    interestPaid:
      typeof row.interest_paid === "string"
        ? Number(row.interest_paid)
        : Number(row.interest_paid),
    paidAt: row.paid_at,
  };
}

export function mapLoanScheduleEntryRow(row: {
  id: string;
  loan_id: string;
  sequence: number;
  due_date: string;
  principal_due: number | string;
  interest_due: number | string;
  total_due: number | string;
  remaining_balance_after: number | string;
  status: string;
  paid_at: string | null;
}): LoanScheduleEntry {
  const status = (
    LOAN_SCHEDULE_ENTRY_STATUS_VALUES as readonly string[]
  ).includes(row.status)
    ? (row.status as LoanScheduleEntryStatusValue)
    : LoanScheduleEntryStatus.UPCOMING;
  return {
    id: row.id,
    loanId: row.loan_id,
    sequence: Number(row.sequence),
    dueDate: row.due_date,
    principalDue:
      typeof row.principal_due === "string"
        ? Number(row.principal_due)
        : Number(row.principal_due),
    interestDue:
      typeof row.interest_due === "string"
        ? Number(row.interest_due)
        : Number(row.interest_due),
    totalDue:
      typeof row.total_due === "string"
        ? Number(row.total_due)
        : Number(row.total_due),
    remainingBalanceAfter:
      typeof row.remaining_balance_after === "string"
        ? Number(row.remaining_balance_after)
        : Number(row.remaining_balance_after),
    status,
    paidAt: row.paid_at,
  };
}

export function mapLoanInterestRatePeriodRow(row: {
  id: string;
  loan_id: string;
  sequence: number;
  effective_from: string;
  effective_to: string | null;
  annual_rate: number | string;
  kind: string;
  note: string | null;
  created_at: string;
}): LoanInterestRatePeriod {
  const kind = (
    LOAN_INTEREST_RATE_PERIOD_KIND_VALUES as readonly string[]
  ).includes(row.kind)
    ? (row.kind as LoanInterestRatePeriodKindValue)
    : LoanInterestRatePeriodKind.FIXED;
  return {
    id: row.id,
    loanId: row.loan_id,
    sequence: Number(row.sequence),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    annualRate:
      typeof row.annual_rate === "string"
        ? Number(row.annual_rate)
        : Number(row.annual_rate),
    kind,
    note: row.note,
    createdAt: row.created_at,
  };
}
