export const ASSET_FLOW_TYPES = {
  CONTRIBUTION: "contribution",
  WITHDRAWAL: "withdrawal",
  INCOME: "income",
  FEE: "fee",
  TAX: "tax",
} as const;

export type AssetFlowType = (typeof ASSET_FLOW_TYPES)[keyof typeof ASSET_FLOW_TYPES];

export const OUTBOUND_FLOW_TYPES: readonly string[] = [
  ASSET_FLOW_TYPES.CONTRIBUTION,
  ASSET_FLOW_TYPES.FEE,
  ASSET_FLOW_TYPES.TAX,
];

export const INBOUND_FLOW_TYPES: readonly string[] = [
  ASSET_FLOW_TYPES.WITHDRAWAL,
  ASSET_FLOW_TYPES.INCOME,
];

export const HISTORY_MODE = {
  QUANTITY: "quantity",
  PRICE: "price",
} as const;

export type HistoryMode = (typeof HISTORY_MODE)[keyof typeof HISTORY_MODE];

export const DEFAULT_ASSET_CLASS = "gold" as const;

export const BOOLEAN_STRING = {
  TRUE: "true",
  FALSE: "false",
} as const;

export const CASHFLOW_HISTORY_LIMIT = 10;
