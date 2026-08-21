/** Scheduled-loan values and loan command error classification. */

/**
 * Scheduled loan / installment obligations (Loan BC).
 * Not credit-card installments — those belong to the Card BC.
 */
export const LoanType = {
  BANK_LOAN: "bank_loan",
  PERSONAL_LOAN: "personal_loan",
  FAMILY_LOAN: "family_loan",
  FRIEND_LOAN: "friend_loan",
  STORE_FINANCING: "store_financing",
  BNPL: "bnpl",
  TUITION: "tuition",
  MEDICAL: "medical",
  VEHICLE: "vehicle",
  HOME: "home",
  OTHER: "other",
} as const;

export type LoanType = (typeof LoanType)[keyof typeof LoanType];

export const LOAN_TYPE_VALUES = [
  LoanType.BANK_LOAN,
  LoanType.PERSONAL_LOAN,
  LoanType.FAMILY_LOAN,
  LoanType.FRIEND_LOAN,
  LoanType.STORE_FINANCING,
  LoanType.BNPL,
  LoanType.TUITION,
  LoanType.MEDICAL,
  LoanType.VEHICLE,
  LoanType.HOME,
  LoanType.OTHER,
] as const;

export const LOAN_TYPE_OPTIONS = LOAN_TYPE_VALUES;

export const LoanStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DEFAULTED: "defaulted",
  ARCHIVED: "archived",
} as const;

export const LoanDueState = {
  UPCOMING: "upcoming",
  DUE_SOON: "due_soon",
  DUE_TODAY: "due_today",
  OVERDUE: "overdue",
  NONE: "none",
} as const;

export type LoanDueState = (typeof LoanDueState)[keyof typeof LoanDueState];

export const LOAN_DUE_SOON_DAYS = 7;

export const LoanCreateStep = {
  BASICS: "basics",
  TERMS: "terms",
} as const;

export type LoanCreateStep =
  (typeof LoanCreateStep)[keyof typeof LoanCreateStep];

export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export const LOAN_STATUS_VALUES = [
  LoanStatus.ACTIVE,
  LoanStatus.COMPLETED,
  LoanStatus.CANCELLED,
  LoanStatus.DEFAULTED,
  LoanStatus.ARCHIVED,
] as const;

export const LoanRepaymentFrequency = {
  MONTHLY: "monthly",
} as const;

export type LoanRepaymentFrequency =
  (typeof LoanRepaymentFrequency)[keyof typeof LoanRepaymentFrequency];

export const LOAN_REPAYMENT_FREQUENCY_VALUES = [
  LoanRepaymentFrequency.MONTHLY,
] as const;

/** Consumer loan repayment methods (amortization engine). */
export const LoanRepaymentMethod = {
  FIXED_MONTHLY: "fixed_monthly",
  REDUCING_BALANCE: "reducing_balance",
} as const;

export type LoanRepaymentMethod =
  (typeof LoanRepaymentMethod)[keyof typeof LoanRepaymentMethod];

export const LOAN_REPAYMENT_METHOD_VALUES = [
  LoanRepaymentMethod.FIXED_MONTHLY,
  LoanRepaymentMethod.REDUCING_BALANCE,
] as const;

export const LOAN_REPAYMENT_METHOD_OPTIONS = LOAN_REPAYMENT_METHOD_VALUES;

/** Interest calculation strategies (orthogonal to repayment method). */
export const LoanInterestStrategy = {
  FIXED: "fixed",
  PROMO_FIXED_TO_FLOATING: "promo_fixed_to_floating",
  FLOATING: "floating",
} as const;

export type LoanInterestStrategy =
  (typeof LoanInterestStrategy)[keyof typeof LoanInterestStrategy];

export const LOAN_INTEREST_STRATEGY_VALUES = [
  LoanInterestStrategy.FIXED,
  LoanInterestStrategy.PROMO_FIXED_TO_FLOATING,
  LoanInterestStrategy.FLOATING,
] as const;

export const LOAN_INTEREST_STRATEGY_OPTIONS = LOAN_INTEREST_STRATEGY_VALUES;

export const LoanInterestRatePeriodKind = {
  FIXED: "fixed",
  PROMOTIONAL: "promotional",
  FLOATING: "floating",
} as const;

export type LoanInterestRatePeriodKind =
  (typeof LoanInterestRatePeriodKind)[keyof typeof LoanInterestRatePeriodKind];

export const LOAN_INTEREST_RATE_PERIOD_KIND_VALUES = [
  LoanInterestRatePeriodKind.FIXED,
  LoanInterestRatePeriodKind.PROMOTIONAL,
  LoanInterestRatePeriodKind.FLOATING,
] as const;

export const LoanTermUnit = {
  MONTHS: "months",
  YEARS: "years",
} as const;

export type LoanTermUnit = (typeof LoanTermUnit)[keyof typeof LoanTermUnit];

export const LOAN_TERM_UNIT_VALUES = [
  LoanTermUnit.MONTHS,
  LoanTermUnit.YEARS,
] as const;

export const LoanScheduleEntryStatus = {
  UPCOMING: "upcoming",
  PAID: "paid",
  PARTIAL: "partial",
  WAIVED: "waived",
} as const;

export const LoanReadStatus = {
  OK: "ok",
  NOT_FOUND: "not_found",
  ERROR: "error",
} as const;

export type LoanReadStatus =
  (typeof LoanReadStatus)[keyof typeof LoanReadStatus];

export const LoanScheduleDisplayStatus = {
  UPCOMING: "upcoming",
  DUE_TODAY: "due_today",
  OVERDUE: "overdue",
  PAID: "paid",
  WAIVED: "waived",
} as const;

export const LoanDetailView = {
  OVERVIEW: "overview",
  SCHEDULE: "schedule",
  HISTORY: "history",
} as const;

export type LoanDetailView =
  (typeof LoanDetailView)[keyof typeof LoanDetailView];

export const LOAN_DETAIL_VIEW_QUERY = "view";

export type LoanScheduleDisplayStatus =
  (typeof LoanScheduleDisplayStatus)[keyof typeof LoanScheduleDisplayStatus];

export type LoanScheduleEntryStatus =
  (typeof LoanScheduleEntryStatus)[keyof typeof LoanScheduleEntryStatus];

export const LOAN_SCHEDULE_ENTRY_STATUS_VALUES = [
  LoanScheduleEntryStatus.UPCOMING,
  LoanScheduleEntryStatus.PAID,
  LoanScheduleEntryStatus.PARTIAL,
  LoanScheduleEntryStatus.WAIVED,
] as const;

export const LoanPaymentMode = {
  SCHEDULED: "scheduled",
  /** @deprecated Mutating early payoff is not authorized; estimate-only in UI. */
  EARLY_PAYOFF: "early_payoff",
} as const;

export type LoanPaymentMode =
  (typeof LoanPaymentMode)[keyof typeof LoanPaymentMode];

/** Modes accepted by record_loan_payment in Phase F5 (scheduled only). */
export const LOAN_PAYMENT_EXECUTABLE_MODE_VALUES = [
  LoanPaymentMode.SCHEDULED,
] as const;

export const LOAN_PAYMENT_MODE_VALUES = [
  LoanPaymentMode.SCHEDULED,
  LoanPaymentMode.EARLY_PAYOFF,
] as const;

export const RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES = [
  "already completed",
  "invalid",
  "credit card",
  "no upcoming",
] as const;

/** Compatibility markers for legacy loan RPCs that still return text errors. */
export const LOAN_LEGACY_RPC_ERROR_MARKERS = [
  ...RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES,
  "authentication required",
  "not a household member",
  "loan not found",
  "loan is not active",
  "fixed interest loans cannot change rate",
  "promo period has not ended",
  "effective from required",
  "effective date",
  "completed loan can only be archived",
] as const;
