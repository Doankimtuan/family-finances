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
  OTHER: "other",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const ACCOUNT_TYPE_VALUES = [
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
  AccountType.OTHER,
] as const;

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
