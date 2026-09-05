/**
 * Compatibility barrel for Ledger constants.
 *
 * Domain-owned definitions live in the focused files below. Keep this path
 * stable for existing application, client, and UI imports.
 */

export * from "./account-constants";
export * from "./credit-card-constants";
export * from "./debt-constants";
export * from "./ledger-shared-constants";
export * from "./loan-constants";
export * from "./transaction-constants";

export const MoneyAssetAllocationKey = {
  ACCOUNTS: "accounts",
  SAVINGS: "savings",
  INVESTMENTS: "investments",
} as const;

export type MoneyAssetAllocationKey =
  (typeof MoneyAssetAllocationKey)[keyof typeof MoneyAssetAllocationKey];

export const MoneyAssetOverviewStatus = {
  COMPLETE: "complete",
  PARTIAL: "partial",
  UNAVAILABLE: "unavailable",
} as const;
