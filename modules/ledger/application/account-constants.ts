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

const ACCOUNT_TYPE_LIQUID_SET = new Set<string>(ACCOUNT_TYPE_LIQUID_VALUES);

export type LiquidAccountType = (typeof ACCOUNT_TYPE_LIQUID_VALUES)[number];

export function isLiquidAccountType(type: string): type is LiquidAccountType {
  return ACCOUNT_TYPE_LIQUID_SET.has(type);
}

/** Account types accepted by the ordinary transaction capture picker. */
export const ACCOUNT_TYPE_CAPTURE_VALUES = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.EWALLET,
  AccountType.BROKERAGE,
  AccountType.CREDIT_CARD,
  AccountType.OTHER,
] as const;

/** Maximum account count that remains scannable as a compact two-column picker. */
export const CAPTURE_ACCOUNT_COMPACT_LIMIT = 4;

const ACCOUNT_TYPE_CAPTURE_SET = new Set<AccountType>(
  ACCOUNT_TYPE_CAPTURE_VALUES,
);

export function isCaptureAccountType(type: AccountType): boolean {
  return ACCOUNT_TYPE_CAPTURE_SET.has(type);
}

/** Account create form options (brokerage + savings omitted; savings is a separate section). */
export const ACCOUNT_TYPE_CREATE_OPTIONS = [
  AccountType.CASH,
  AccountType.CHECKING,
  AccountType.EWALLET,
  AccountType.CREDIT_CARD,
  AccountType.OTHER,
] as const;
