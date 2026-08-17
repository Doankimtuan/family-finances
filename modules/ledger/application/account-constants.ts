/** Ledger account types and account-creation options. */

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

/** Account create form options (brokerage + savings omitted; savings is a separate section). */
export const ACCOUNT_TYPE_CREATE_OPTIONS = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.EWALLET,
  AccountType.CREDIT_CARD,
  AccountType.OTHER,
] as const;
