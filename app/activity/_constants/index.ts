// Pagination limits
export const TRANSACTION_HISTORY_LIMIT = 50;
export const TRANSACTION_QUERY_LIMIT = 51;
export const QUICK_CATEGORIES_COUNT = 8;
export const PAGINATION_PAGE_SIZE = 20;

// Transaction types
export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// Transaction statuses
export const TRANSACTION_STATUS = {
  CLEARED: "cleared",
  PENDING: "pending",
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

// Transaction subtypes
export const SAVINGS_SUBTYPE_PREFIX = "savings_";
export const SAVINGS_PRINCIPAL_WITHDRAWAL = "savings_principal_withdrawal";
export const SAVINGS_PRINCIPAL_DEPOSIT = "savings_principal_deposit";

// Card billing item types
export const BILLING_ITEM_TYPE_STANDARD = "standard";
