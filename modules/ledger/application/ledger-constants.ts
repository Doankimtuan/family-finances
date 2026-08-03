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

export const TRANSACTION_DIRECTION_VALUES = [
  TransactionDirection.INCOME,
  TransactionDirection.EXPENSE,
] as const;

export const AccountType = {
  CASH: "cash",
  CHECKING: "checking",
  SAVINGS: "savings",
  EWALLET: "ewallet",
  BROKERAGE: "brokerage",
  CREDIT_CARD: "credit_card",
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

/** Account create form options (brokerage omitted from MVP UI). */
export const ACCOUNT_TYPE_CREATE_OPTIONS = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.SAVINGS,
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

/** Legacy-compatible defaults for new credit cards. */
export const DEFAULT_CARD_STATEMENT_DAY = 25;
export const DEFAULT_CARD_DUE_DAY = 15;
export const DEFAULT_CARD_INSTALLMENT_COUNT = 3;

export const CARD_UTILIZATION_WARN_PCT = 50;
export const CARD_UTILIZATION_DANGER_PCT = 80;

/** Ledger-only mutation errors (not shared across plan/inbox forms). */
export const LEDGER_ACTION_ERROR_CODE = {
  CREDIT_LIMIT_EXCEEDED: "credit_limit_exceeded",
} as const;

export type LedgerActionErrorCode =
  (typeof LEDGER_ACTION_ERROR_CODE)[keyof typeof LEDGER_ACTION_ERROR_CODE];

export const TransactionFilterType = {
  ALL: "all",
  ...TransactionDirection,
} as const;

export type TransactionFilterType =
  (typeof TransactionFilterType)[keyof typeof TransactionFilterType];

export const TRANSACTION_FILTER_OPTIONS = [
  TransactionFilterType.ALL,
  TransactionFilterType.EXPENSE,
  TransactionFilterType.INCOME,
] as const;
