/** Transaction movement, capture, lifecycle, filter, tag, and provenance values. */

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

/** Stable persisted values for optional, cross-cutting transaction tags. */
export const TransactionTagIconKey = {
  BRIEFCASE: "briefcase",
  BOOKMARK: "bookmark",
  EDUCATION: "education",
  FAMILY: "family",
  FOOD: "food",
  GIFT: "gift",
  HEALTH: "health",
  HOME: "home",
  SHOPPING: "shopping",
  STAR: "star",
  SUBSCRIPTION: "subscription",
  TRANSPORT: "transport",
  TRAVEL: "travel",
  WORK: "work",
} as const;

export type TransactionTagIconKey =
  (typeof TransactionTagIconKey)[keyof typeof TransactionTagIconKey];

export const TRANSACTION_TAG_ICON_KEYS = Object.values(TransactionTagIconKey);

export const TransactionTagColorKey = {
  AMBER: "amber",
  BLUE: "blue",
  EMERALD: "emerald",
  ROSE: "rose",
  SLATE: "slate",
  VIOLET: "violet",
} as const;

export type TransactionTagColorKey =
  (typeof TransactionTagColorKey)[keyof typeof TransactionTagColorKey];

export const TRANSACTION_TAG_COLOR_KEYS = Object.values(TransactionTagColorKey);

export const MAX_TRANSACTION_TAGS = 10;

export const DEFAULT_TRANSACTION_TAG_ICON_KEY = TransactionTagIconKey.BOOKMARK;
export const DEFAULT_TRANSACTION_TAG_COLOR_KEY = TransactionTagColorKey.SLATE;

export function normalizeTransactionTagIconKey(
  value: string,
): TransactionTagIconKey {
  return (TRANSACTION_TAG_ICON_KEYS as readonly string[]).includes(value)
    ? (value as TransactionTagIconKey)
    : DEFAULT_TRANSACTION_TAG_ICON_KEY;
}

export function normalizeTransactionTagColorKey(
  value: string | null,
): TransactionTagColorKey | null {
  return value &&
    (TRANSACTION_TAG_COLOR_KEYS as readonly string[]).includes(value)
    ? (value as TransactionTagColorKey)
    : value == null
      ? null
      : DEFAULT_TRANSACTION_TAG_COLOR_KEY;
}

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

export const TRANSFER_IDEMPOTENCY_KEY_PREFIX = "xfer:";
export const TRANSFER_IDEMPOTENCY_KEY_MIN_LEN = 8;
export const TRANSFER_IDEMPOTENCY_KEY_MAX_LEN = 160;

export function createTransferIdempotencyKey(): string {
  return `${TRANSFER_IDEMPOTENCY_KEY_PREFIX}${crypto.randomUUID()}`;
}

export const RECORD_TRANSFER_INVALID_ERROR_NEEDLES = [
  "invalid",
  "not found",
  "must differ",
  "cannot be",
  "authentication",
  "household",
  "forbidden",
  "transfer replay incomplete",
] as const;

export const TransactionFilterType = {
  ALL: "all",
  ...TransactionDirection,
  TRANSFER: "transfer",
  INVESTMENT: "investment",
  SAVINGS: "savings",
  DEBT: "debt",
} as const;

export const TRANSACTION_TAG_FILTER_QUERY_PARAM = "tags";

export type TransactionFilterType =
  (typeof TransactionFilterType)[keyof typeof TransactionFilterType];

export const TRANSACTION_FILTER_OPTIONS = [
  TransactionFilterType.ALL,
  TransactionFilterType.EXPENSE,
  TransactionFilterType.INCOME,
  TransactionFilterType.TRANSFER,
  TransactionFilterType.INVESTMENT,
  TransactionFilterType.SAVINGS,
  TransactionFilterType.DEBT,
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
