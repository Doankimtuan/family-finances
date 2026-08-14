/**
 * Ledger domain constants — single source for Zod schemas, UI, and mappers.
 */

export const DEFAULT_CURRENCY = "VND";

export const TransactionDirection = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type TransactionDirection =
  (typeof TransactionDirection)[keyof typeof TransactionDirection];

/** Capture / edit segmented-control order (expense first). */
export const TRANSACTION_DIRECTION_OPTIONS = [
  TransactionDirection.EXPENSE,
  TransactionDirection.INCOME,
] as const;

export const TRANSACTION_AMOUNT_PREFIX = {
  [TransactionDirection.EXPENSE]: "-",
  [TransactionDirection.INCOME]: "+",
} as const;

/** Capture / correct / category kinds — income and expense only. */
export const TRANSACTION_DIRECTION_VALUES = [
  TransactionDirection.INCOME,
  TransactionDirection.EXPENSE,
] as const;

/**
 * Persisted ledger movement kinds.
 * Liability payment is a real-money repayment that is not income or expense.
 * Transfer legs are owned-account location changes — never income or expense.
 * Investment movements remain neutral ledger semantics; investment income is
 * reported by Investments and does not enter ordinary salary logic.
 */
export const TransactionLedgerType = {
  ...TransactionDirection,
  LIABILITY_PAYMENT: "liability_payment",
  DEBT_BORROWING: "debt_borrowing",
  DEBT_LENDING: "debt_lending",
  DEBT_RECEIVABLE_PAYMENT: "debt_receivable_payment",
  TRANSFER_OUT: "transfer_out",
  TRANSFER_IN: "transfer_in",
  INVESTMENT_BUY: "investment_buy",
  INVESTMENT_SELL_PROCEEDS: "investment_sell_proceeds",
  INVESTMENT_INCOME: "investment_income",
  INVESTMENT_FEE: "investment_fee",
} as const;

export type TransactionLedgerType =
  (typeof TransactionLedgerType)[keyof typeof TransactionLedgerType];

export const TRANSACTION_LEDGER_TYPE_VALUES = [
  TransactionLedgerType.INCOME,
  TransactionLedgerType.EXPENSE,
  TransactionLedgerType.LIABILITY_PAYMENT,
  TransactionLedgerType.DEBT_BORROWING,
  TransactionLedgerType.DEBT_LENDING,
  TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT,
  TransactionLedgerType.TRANSFER_OUT,
  TransactionLedgerType.TRANSFER_IN,
  TransactionLedgerType.INVESTMENT_BUY,
  TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
  TransactionLedgerType.INVESTMENT_INCOME,
  TransactionLedgerType.INVESTMENT_FEE,
] as const;

export const TRANSACTION_LEDGER_AMOUNT_PREFIX = {
  [TransactionLedgerType.EXPENSE]: "-",
  [TransactionLedgerType.INCOME]: "+",
  [TransactionLedgerType.LIABILITY_PAYMENT]: "-",
  [TransactionLedgerType.DEBT_BORROWING]: "+",
  [TransactionLedgerType.DEBT_LENDING]: "-",
  [TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT]: "+",
  [TransactionLedgerType.TRANSFER_OUT]: "-",
  [TransactionLedgerType.TRANSFER_IN]: "+",
  [TransactionLedgerType.INVESTMENT_BUY]: "-",
  [TransactionLedgerType.INVESTMENT_SELL_PROCEEDS]: "+",
  [TransactionLedgerType.INVESTMENT_INCOME]: "+",
  [TransactionLedgerType.INVESTMENT_FEE]: "-",
} as const;

export const TRANSACTION_LEDGER_CREDIT_TYPES = [
  TransactionLedgerType.INCOME,
  TransactionLedgerType.DEBT_BORROWING,
  TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT,
  TransactionLedgerType.TRANSFER_IN,
  TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
  TransactionLedgerType.INVESTMENT_INCOME,
] as const;

export const TRANSACTION_LEDGER_DEBIT_TYPES = [
  TransactionLedgerType.EXPENSE,
  TransactionLedgerType.DEBT_LENDING,
  TransactionLedgerType.LIABILITY_PAYMENT,
  TransactionLedgerType.TRANSFER_OUT,
  TransactionLedgerType.INVESTMENT_BUY,
  TransactionLedgerType.INVESTMENT_FEE,
] as const;

/** Capture surface modes — income/expense fast path plus neutral transfer. */
export const MoneyCaptureMode = {
  ...TransactionDirection,
  TRANSFER: "transfer",
} as const;

export type MoneyCaptureMode =
  (typeof MoneyCaptureMode)[keyof typeof MoneyCaptureMode];

export const MONEY_CAPTURE_MODE_OPTIONS = [
  MoneyCaptureMode.EXPENSE,
  MoneyCaptureMode.INCOME,
  MoneyCaptureMode.TRANSFER,
] as const;

/**
 * Ledger posting lifecycle (BR-02 / BR-03).
 * Snake_case storage matches rewrite DB enum convention; Spec PascalCase maps 1:1.
 */
export const TransactionStatus = {
  PENDING_MAPPING: "pending_mapping",
  POSTED: "posted",
  PARTIALLY_REFUNDED: "partially_refunded",
  FULLY_REFUNDED: "fully_refunded",
  REVERSED: "reversed",
} as const;

export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const TRANSACTION_STATUS_VALUES = [
  TransactionStatus.PENDING_MAPPING,
  TransactionStatus.POSTED,
  TransactionStatus.PARTIALLY_REFUNDED,
  TransactionStatus.FULLY_REFUNDED,
  TransactionStatus.REVERSED,
] as const;

/** Statuses that may still accept a refund (BR-02). */
export const TRANSACTION_REFUNDABLE_STATUS_VALUES = [
  TransactionStatus.POSTED,
  TransactionStatus.PARTIALLY_REFUNDED,
] as const;

/** Statuses that may be corrected via 3-way chain (BR-03). */
export const TRANSACTION_CORRECTABLE_STATUS_VALUES = [
  TransactionStatus.POSTED,
  TransactionStatus.PENDING_MAPPING,
] as const;

/**
 * Statuses that affect account cash / jar capacity math.
 * Includes reversed originals so reversal legs can offset them (BR-03).
 */
export const TRANSACTION_BALANCE_STATUS_VALUES = [
  TransactionStatus.PENDING_MAPPING,
  TransactionStatus.POSTED,
  TransactionStatus.PARTIALLY_REFUNDED,
  TransactionStatus.FULLY_REFUNDED,
  TransactionStatus.REVERSED,
] as const;

export const AccountType = {
  CASH: "cash",
  CHECKING: "checking",
  SAVINGS: "savings",
  EWALLET: "ewallet",
  BROKERAGE: "brokerage",
  CREDIT_CARD: "credit_card",
  SAVINGS_PRODUCT: "savings_product",
  OTHER: "other",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const ACCOUNT_TYPE_VALUES = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.EWALLET,
  AccountType.BROKERAGE,
  AccountType.CREDIT_CARD,
  AccountType.SAVINGS_PRODUCT,
  AccountType.OTHER,
] as const;

/** Liquid account types that contribute to Real Position (BR-01). */
export const ACCOUNT_TYPE_LIQUID_VALUES = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.EWALLET,
  AccountType.BROKERAGE,
  AccountType.OTHER,
] as const;

/** Informal personal-debt relationship from the household's perspective. */
export const DebtDirection = {
  BORROWED: "borrowed",
  LENT: "lent",
} as const;
export type DebtDirection = (typeof DebtDirection)[keyof typeof DebtDirection];
export const DEBT_DIRECTION_VALUES = [
  DebtDirection.BORROWED,
  DebtDirection.LENT,
] as const;

/** Whether ViNha records a historical balance or a movement happening now. */
export const DebtCreationMode = {
  EXISTING_BALANCE: "existing_balance",
  MONEY_MOVED: "money_moved",
} as const;
export type DebtCreationMode =
  (typeof DebtCreationMode)[keyof typeof DebtCreationMode];
export const DEBT_CREATION_MODE_VALUES = [
  DebtCreationMode.EXISTING_BALANCE,
  DebtCreationMode.MONEY_MOVED,
] as const;

/** Persisted debt lifecycle. Due state remains derived from this and due date. */
export const DebtStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];
export const DEBT_STATUS_VALUES = [
  DebtStatus.ACTIVE,
  DebtStatus.COMPLETED,
  DebtStatus.ARCHIVED,
] as const;

/** Direction of a principal settlement record. */
export const DebtPaymentDirection = {
  REPAY_BORROWED: "repay_borrowed",
  RECEIVE_LENT: "receive_lent",
} as const;
export type DebtPaymentDirection =
  (typeof DebtPaymentDirection)[keyof typeof DebtPaymentDirection];
export const DEBT_PAYMENT_DIRECTION_VALUES = [
  DebtPaymentDirection.REPAY_BORROWED,
  DebtPaymentDirection.RECEIVE_LENT,
] as const;

/** Derived debt timing state; it is intentionally not persisted. */
export const DebtDueState = {
  NONE: "none",
  UPCOMING: "upcoming",
  DUE_SOON: "due_soon",
  DUE_TODAY: "due_today",
  OVERDUE: "overdue",
  COMPLETED: "completed",
} as const;
export type DebtDueState = (typeof DebtDueState)[keyof typeof DebtDueState];
export const DEBT_DUE_SOON_DAYS = 7;
export const DebtProgressState = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;
export type DebtProgressState =
  (typeof DebtProgressState)[keyof typeof DebtProgressState];
export const DEBT_NO_DUE_SORT_DATE = "9999-12-31";
export const DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX = "debt-create:";
export const DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX = "debt-payment:";
export function createDebtIdempotencyKey(prefix: string): string {
  return `${prefix}${crypto.randomUUID()}`;
}
/** Account create form options (brokerage + savings omitted; savings is a separate section). */
export const ACCOUNT_TYPE_CREATE_OPTIONS = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.EWALLET,
  AccountType.CREDIT_CARD,
  AccountType.OTHER,
] as const;

export const CardBillingMonthStatus = {
  OPEN: "open",
  PARTIAL: "partial",
  SETTLED: "settled",
} as const;

export type CardBillingMonthStatus =
  (typeof CardBillingMonthStatus)[keyof typeof CardBillingMonthStatus];

export const CARD_BILLING_MONTH_STATUS_VALUES = [
  CardBillingMonthStatus.OPEN,
  CardBillingMonthStatus.PARTIAL,
  CardBillingMonthStatus.SETTLED,
] as const;

export const CardBillingItemType = {
  STANDARD: "standard",
  INSTALLMENT: "installment",
} as const;

export type CardBillingItemType =
  (typeof CardBillingItemType)[keyof typeof CardBillingItemType];

export const CARD_BILLING_ITEM_TYPE_VALUES = [
  CardBillingItemType.STANDARD,
  CardBillingItemType.INSTALLMENT,
] as const;

/** Card purchase trackers are distinct from the Loan bounded context. */
export const CreditCardInstallmentOrigin = {
  POST_PURCHASE: "post_purchase",
  PARTNER_MERCHANT: "partner_merchant",
  OTHER: "other",
} as const;
export type CreditCardInstallmentOrigin =
  (typeof CreditCardInstallmentOrigin)[keyof typeof CreditCardInstallmentOrigin];
export const CREDIT_CARD_INSTALLMENT_ORIGIN_VALUES = [
  CreditCardInstallmentOrigin.POST_PURCHASE,
  CreditCardInstallmentOrigin.PARTNER_MERCHANT,
  CreditCardInstallmentOrigin.OTHER,
] as const;

export const CreditCardInstallmentProgram = {
  ZERO_INTEREST_ZERO_FEE: "zero_interest_zero_fee",
  ZERO_INTEREST_WITH_CONVERSION_FEE: "zero_interest_with_conversion_fee",
  FLAT_INTEREST_WITHOUT_CONVERSION_FEE: "flat_interest_without_conversion_fee",
  FLAT_INTEREST_WITH_CONVERSION_FEE: "flat_interest_with_conversion_fee",
  BANK_QUOTED: "bank_quoted",
} as const;
export type CreditCardInstallmentProgram =
  (typeof CreditCardInstallmentProgram)[keyof typeof CreditCardInstallmentProgram];
export const CREDIT_CARD_INSTALLMENT_PROGRAM_VALUES = [
  CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
  CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE,
  CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE,
  CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE,
  CreditCardInstallmentProgram.BANK_QUOTED,
] as const;

export const CreditCardInstallmentFeeType = {
  NONE: "none",
  FIXED: "fixed",
  PERCENTAGE: "percentage",
} as const;
export type CreditCardInstallmentFeeType =
  (typeof CreditCardInstallmentFeeType)[keyof typeof CreditCardInstallmentFeeType];
export const CREDIT_CARD_INSTALLMENT_FEE_TYPE_VALUES = [
  CreditCardInstallmentFeeType.NONE,
  CreditCardInstallmentFeeType.FIXED,
  CreditCardInstallmentFeeType.PERCENTAGE,
] as const;

export const CreditCardInstallmentFeeTiming = {
  FIRST_EXPECTED_PERIOD: "first_expected_period",
  SPREAD_ACROSS_PERIODS: "spread_across_periods",
  INCLUDED_IN_BANK_QUOTE: "included_in_bank_quote",
} as const;
export type CreditCardInstallmentFeeTiming =
  (typeof CreditCardInstallmentFeeTiming)[keyof typeof CreditCardInstallmentFeeTiming];
export const CREDIT_CARD_INSTALLMENT_FEE_TIMING_VALUES = [
  CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
  CreditCardInstallmentFeeTiming.SPREAD_ACROSS_PERIODS,
  CreditCardInstallmentFeeTiming.INCLUDED_IN_BANK_QUOTE,
] as const;
export const CreditCardInstallmentCalculationSource = {
  DERIVED: "derived",
  BANK_QUOTED: "bank_quoted",
} as const;
export type CreditCardInstallmentCalculationSource =
  (typeof CreditCardInstallmentCalculationSource)[keyof typeof CreditCardInstallmentCalculationSource];
export const CREDIT_CARD_INSTALLMENT_CALCULATION_SOURCE_VALUES = [
  CreditCardInstallmentCalculationSource.DERIVED,
  CreditCardInstallmentCalculationSource.BANK_QUOTED,
] as const;

export const CreditCardInstallmentStatus = {
  ACTIVE: "active",
  STOPPED: "stopped",
  REVIEW_REQUIRED: "review_required",
  COMPLETED: "completed",
} as const;
export type CreditCardInstallmentStatus =
  (typeof CreditCardInstallmentStatus)[keyof typeof CreditCardInstallmentStatus];
export const CREDIT_CARD_INSTALLMENT_STATUS_VALUES = [
  CreditCardInstallmentStatus.ACTIVE,
  CreditCardInstallmentStatus.STOPPED,
  CreditCardInstallmentStatus.REVIEW_REQUIRED,
  CreditCardInstallmentStatus.COMPLETED,
] as const;

export const CreditCardInstallmentScheduleStatus = {
  EXPECTED: "expected",
  CONFIRMED: "confirmed",
} as const;
export type CreditCardInstallmentScheduleStatus =
  (typeof CreditCardInstallmentScheduleStatus)[keyof typeof CreditCardInstallmentScheduleStatus];
export const CREDIT_CARD_INSTALLMENT_SCHEDULE_STATUS_VALUES = [
  CreditCardInstallmentScheduleStatus.EXPECTED,
  CreditCardInstallmentScheduleStatus.CONFIRMED,
] as const;

export const CARD_INSTALLMENT_TERM_PRESETS = [3, 6, 9, 12, 18, 24] as const;

/** Legacy-compatible defaults for new credit cards. */
export const DEFAULT_CARD_STATEMENT_DAY = 25;
export const DEFAULT_CARD_DUE_DAY = 15;
export const DEFAULT_CARD_INSTALLMENT_COUNT = 3;

export const CARD_UTILIZATION_WARN_PCT = 50;
export const CARD_UTILIZATION_DANGER_PCT = 80;

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

/**
 * Preview → confirm → receipt flow for liability payments (card settle, loan pay).
 */
export const MoneyPaymentFlowStep = {
  FORM: "form",
  CONFIRM: "confirm",
  RECEIPT: "receipt",
} as const;

export type MoneyPaymentFlowStep =
  (typeof MoneyPaymentFlowStep)[keyof typeof MoneyPaymentFlowStep];

/** YYYY-MM-DD calendar date (Zod + HTML date inputs). */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX = "card-pay:";
export const CARD_PAYMENT_IDEMPOTENCY_KEY_MIN_LEN = 8;
export const CARD_PAYMENT_IDEMPOTENCY_KEY_MAX_LEN = 160;

export function createCardPaymentIdempotencyKey(): string {
  return `${CARD_PAYMENT_IDEMPOTENCY_KEY_PREFIX}${crypto.randomUUID()}`;
}

export const TRANSFER_IDEMPOTENCY_KEY_PREFIX = "xfer:";
export const TRANSFER_IDEMPOTENCY_KEY_MIN_LEN = 8;
export const TRANSFER_IDEMPOTENCY_KEY_MAX_LEN = 160;

export function createTransferIdempotencyKey(): string {
  return `${TRANSFER_IDEMPOTENCY_KEY_PREFIX}${crypto.randomUUID()}`;
}

/** Supabase RPC names used by ledger money-product commands. */
export const LedgerRpcName = {
  SETTLE_CARD_PAYMENT: "settle_card_payment",
  RECORD_LOAN_PAYMENT: "record_loan_payment",
  UPDATE_LOAN_INTEREST_RATE: "update_loan_interest_rate",
  RECORD_LIABILITY_PAYMENT: "record_liability_payment",
  CREATE_DEBT: "create_debt",
  RECORD_DEBT_PAYMENT: "record_debt_payment",
  CREATE_LOAN_WITH_SCHEDULE: "create_loan_with_schedule",
  SET_LOAN_STATUS: "set_loan_status",
  RECORD_OWNED_ACCOUNT_TRANSFER: "record_owned_account_transfer",
} as const;

export type LedgerRpcName = (typeof LedgerRpcName)[keyof typeof LedgerRpcName];

/** Public relation names for ledger queries / mutations. */
export const LedgerRelation = {
  DEBT_PAYMENTS: "debt_payments",
  LOAN_SCHEDULE_ENTRIES: "loan_schedule_entries",
  LOAN_PAYMENTS: "loan_payments",
  LOAN_INTEREST_RATE_PERIODS: "loan_interest_rate_periods",
} as const;

export type LedgerRelation =
  (typeof LedgerRelation)[keyof typeof LedgerRelation];

/** Lowercased PostgREST / RPC message needles mapped to INVALID. */
export const SETTLE_CARD_INVALID_ERROR_NEEDLES = [
  "invalid",
  "not found",
  "exceeds",
  "no remaining",
  "cannot be",
] as const;

export const RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES = [
  "already completed",
  "invalid",
  "credit card",
  "no upcoming",
] as const;

export const RECORD_TRANSFER_INVALID_ERROR_NEEDLES = [
  "invalid",
  "not found",
  "must differ",
  "cannot be",
  "authentication",
  "household",
] as const;

/** Ledger-only mutation errors (not shared across plan/inbox forms). */
export const LEDGER_ACTION_ERROR_CODE = {
  CREDIT_LIMIT_EXCEEDED: "credit_limit_exceeded",
  CATEGORY_UNMAPPED: "category_unmapped",
  REFUND_INVALID: "refund_invalid",
  CORRECTION_INVALID: "correction_invalid",
  IMMUTABLE: "immutable",
  CONVERT_AFTER_PAYMENT: "convert_after_payment",
} as const;

export type LedgerActionErrorCode =
  (typeof LEDGER_ACTION_ERROR_CODE)[keyof typeof LEDGER_ACTION_ERROR_CODE];

export const TransactionFilterType = {
  ALL: "all",
  ...TransactionDirection,
  INVESTMENT: "investment",
} as const;

export type TransactionFilterType =
  (typeof TransactionFilterType)[keyof typeof TransactionFilterType];

export const TRANSACTION_FILTER_OPTIONS = [
  TransactionFilterType.ALL,
  TransactionFilterType.EXPENSE,
  TransactionFilterType.INCOME,
  TransactionFilterType.INVESTMENT,
] as const;

/** REQ-TRN-03 — transaction provenance for pattern auto-resolution. */
export const TransactionSource = {
  MANUAL: "manual",
  BANK_FEED: "bank_feed",
  RECURRING_PATTERN: "recurring_pattern",
} as const;

export type TransactionSource =
  (typeof TransactionSource)[keyof typeof TransactionSource];

export const TRANSACTION_SOURCE_VALUES = [
  TransactionSource.MANUAL,
  TransactionSource.BANK_FEED,
  TransactionSource.RECURRING_PATTERN,
] as const;
