/** Investments domain constants. Persisted values are declared here before use. */
export const InvestmentAssetClass = {
  CRYPTO: "crypto",
  STOCK: "stock",
  FUND: "fund",
  GOLD: "gold",
  BOND: "bond",
} as const;
export type InvestmentAssetClass =
  (typeof InvestmentAssetClass)[keyof typeof InvestmentAssetClass];
export const INVESTMENT_ASSET_CLASS_VALUES = Object.values(InvestmentAssetClass);

export const InvestmentHistoryStatus = {
  FULL: "full",
  OPENING_POSITION: "opening_position",
  COST_BASIS_UNKNOWN: "cost_basis_unknown",
} as const;
export type InvestmentHistoryStatus =
  (typeof InvestmentHistoryStatus)[keyof typeof InvestmentHistoryStatus];
export const INVESTMENT_HISTORY_STATUS_VALUES = Object.values(
  InvestmentHistoryStatus,
);

export const InvestmentLifecycleStatus = {
  ACTIVE: "active",
  EXITED: "exited",
  UNDER_REVIEW: "under_review",
} as const;
export type InvestmentLifecycleStatus =
  (typeof InvestmentLifecycleStatus)[keyof typeof InvestmentLifecycleStatus];
export const INVESTMENT_LIFECYCLE_STATUS_VALUES = Object.values(
  InvestmentLifecycleStatus,
);

export const InvestmentVisibilityContext = {
  HOUSEHOLD: "household",
  UNCLEAR: "unclear",
} as const;
export type InvestmentVisibilityContext =
  (typeof InvestmentVisibilityContext)[keyof typeof InvestmentVisibilityContext];
export const INVESTMENT_VISIBILITY_CONTEXT_VALUES = Object.values(
  InvestmentVisibilityContext,
);

export const InvestmentOperationType = {
  OPENING_POSITION: "opening_position",
  BUY: "buy",
  SELL: "sell",
  ASSET_CONVERSION: "asset_conversion",
  INVESTMENT_INCOME: "investment_income",
} as const;
export type InvestmentOperationType =
  (typeof InvestmentOperationType)[keyof typeof InvestmentOperationType];
export const INVESTMENT_OPERATION_TYPE_VALUES = Object.values(
  InvestmentOperationType,
);

export const InvestmentActivityType = {
  ...InvestmentOperationType,
  VALUATION: "valuation",
} as const;
export type InvestmentActivityType =
  (typeof InvestmentActivityType)[keyof typeof InvestmentActivityType];

export const InvestmentFeeSource = {
  CASH: "cash",
  SOURCE_ASSET: "source_asset",
  DESTINATION_ASSET: "destination_asset",
  OTHER_INVESTMENT: "other_investment",
} as const;
export type InvestmentFeeSource =
  (typeof InvestmentFeeSource)[keyof typeof InvestmentFeeSource];
export const INVESTMENT_FEE_SOURCE_VALUES = Object.values(InvestmentFeeSource);

export const InvestmentIncomeKind = {
  DIVIDEND: "dividend",
  INTEREST: "interest",
  DISTRIBUTION: "distribution",
  OTHER: "other",
} as const;
export type InvestmentIncomeKind =
  (typeof InvestmentIncomeKind)[keyof typeof InvestmentIncomeKind];
export const INVESTMENT_INCOME_KIND_VALUES = Object.values(InvestmentIncomeKind);

export const InvestmentValuationSource = {
  MANUAL: "manual",
  STATEMENT: "statement",
  PROVIDER: "provider",
} as const;
export type InvestmentValuationSource =
  (typeof InvestmentValuationSource)[keyof typeof InvestmentValuationSource];
export const INVESTMENT_VALUATION_SOURCE_VALUES = Object.values(
  InvestmentValuationSource,
);

export const INVESTMENT_RPC = {
  OPENING_POSITION: "record_investment_opening_position",
  BUY: "record_investment_buy",
  SELL: "record_investment_sell",
  CONVERSION: "record_investment_conversion",
  INCOME: "record_investment_income",
  VALUATION: "record_investment_valuation",
} as const;

export const InvestmentFormMode = {
  BUY: InvestmentOperationType.BUY,
  SELL: InvestmentOperationType.SELL,
  CONVERSION: InvestmentOperationType.ASSET_CONVERSION,
  INCOME: InvestmentOperationType.INVESTMENT_INCOME,
  VALUATION: "valuation",
} as const;
export type InvestmentFormMode =
  (typeof InvestmentFormMode)[keyof typeof InvestmentFormMode];

export const INVESTMENT_QUANTITY_SCALE = 18;
export const INVESTMENT_QUANTITY_STORAGE_PRECISION = 38;
export const INVESTMENT_REPORTING_CURRENCY = "VND";

export const INVESTMENT_ERROR_CODE = {
  INVALID: "invalid",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  INSUFFICIENT_QUANTITY: "insufficient_quantity",
  BASIS_UNAVAILABLE: "basis_unavailable",
  UNKNOWN: "unknown",
} as const;
export type InvestmentErrorCode =
  (typeof INVESTMENT_ERROR_CODE)[keyof typeof INVESTMENT_ERROR_CODE];

export const INVESTMENT_VALIDATION_MESSAGE = {
  INVALID_CASH_FEE: "INVALID_CASH_FEE",
  INVALID_ASSET_FEE: "INVALID_ASSET_FEE",
  INVALID_FEE_HOLDING: "INVALID_FEE_HOLDING",
} as const;
