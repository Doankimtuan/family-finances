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
export const INVESTMENT_ASSET_CLASS_VALUES =
  Object.values(InvestmentAssetClass);

export const MarketAssetClass = InvestmentAssetClass;
export type MarketAssetClass = InvestmentAssetClass;
export const MARKET_ASSET_CLASS_VALUES = INVESTMENT_ASSET_CLASS_VALUES;

export const MarketPricingMode = {
  UNIT_PRICE: "UNIT_PRICE",
  NAV_PER_UNIT: "NAV_PER_UNIT",
  BUYBACK_PRICE: "BUYBACK_PRICE",
  TOTAL_VALUE: "TOTAL_VALUE",
  MANUAL: "MANUAL",
} as const;
export type MarketPricingMode =
  (typeof MarketPricingMode)[keyof typeof MarketPricingMode];
export const MARKET_PRICING_MODE_VALUES = Object.values(MarketPricingMode);

export const MarketDataProvider = {
  MANUAL: "MANUAL",
  COINGECKO: "COINGECKO",
  VNSTOCK: "VNSTOCK",
  FMARKET: "FMARKET",
  VANG_TODAY: "VANG_TODAY",
} as const;
export type MarketDataProvider =
  (typeof MarketDataProvider)[keyof typeof MarketDataProvider];
export const MARKET_DATA_PROVIDER_VALUES = Object.values(MarketDataProvider);

export const MARKET_SYNC_PROVIDER_VALUES = [
  MarketDataProvider.COINGECKO,
  MarketDataProvider.VNSTOCK,
  MarketDataProvider.FMARKET,
  MarketDataProvider.VANG_TODAY,
] as const;
export type MarketSyncProvider = (typeof MARKET_SYNC_PROVIDER_VALUES)[number];

export const MARKET_CATALOG_SYNC_OPERATION = {
  RUN: "marketCatalogSync",
  SEARCH: "listMarketInstruments",
} as const;

export const MARKET_CATALOG_QUERY_LIMIT = {
  DEFAULT: 25,
  MAX: 50,
} as const;

export const MARKET_CATALOG_CRYPTO_LIMIT = 500;

export const MARKET_CATALOG_SYNC_SECRET_ENV = "MARKET_CATALOG_SYNC_SECRET";
export const MARKET_PRICE_SYNC_SECRET_ENV = "MARKET_PRICE_SYNC_SECRET";

export const MARKET_PRICE_SYNC_OPERATION = {
  RUN: "marketPriceSync",
} as const;

export const MarketSyncStatus = {
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  PARTIAL: "partial",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;
export type MarketSyncStatus =
  (typeof MarketSyncStatus)[keyof typeof MarketSyncStatus];
export const MARKET_SYNC_STATUS_VALUES = Object.values(MarketSyncStatus);

export const MARKET_PRICE_SYNC_LOCK_KEY = "market-price-sync";
export const MARKET_PRICE_SYNC_LOCK_TTL_MINUTES = 30;
export const MARKET_PRICE_SYNC_BATCH_SIZE = 250;
export const MARKET_PRICE_SYNC_ERROR_LIMIT = 500;
export const MARKET_PRICE_SYNC_RPC = {
  LIST_TARGETS: "list_active_market_price_targets",
  ACQUIRE_LOCK: "try_acquire_market_price_sync_lock",
  RELEASE_LOCK: "release_market_price_sync_lock",
} as const;

export const MARKET_PRICE_SYNC_SCHEDULE = {
  TIMEZONE: "Asia/Ho_Chi_Minh",
  CRYPTO_CRON_UTC: "0 4 * * *",
  VNSTOCK_CRON_UTC: "30 8 * * 1-5",
  FMARKET_CRON_UTC: "0 11 * * 1-5",
  VANG_TODAY_CRON_UTC: "0 12 * * *",
} as const;

export const VANG_TODAY_MAX_PRICE_AGE_HOURS = 24;

export const MARKET_CATALOG_QUERY_ERROR_CODE = {
  INVALID: "invalid",
  READ_FAILED: "read_failed",
} as const;
export type MarketCatalogQueryErrorCode =
  (typeof MARKET_CATALOG_QUERY_ERROR_CODE)[keyof typeof MARKET_CATALOG_QUERY_ERROR_CODE];

export const MarketPriceType = {
  LAST: "LAST",
  NAV: "NAV",
  BUYBACK: "BUYBACK",
  TOTAL_VALUE: "TOTAL_VALUE",
  MANUAL: "MANUAL",
} as const;
export type MarketPriceType =
  (typeof MarketPriceType)[keyof typeof MarketPriceType];
export const MARKET_PRICE_TYPE_VALUES = Object.values(MarketPriceType);

export const MarketValuationQuality = {
  AUTO_CURRENT: "AUTO_CURRENT",
  AUTO_STALE: "AUTO_STALE",
  MANUAL: "MANUAL",
  UNKNOWN: "UNKNOWN",
} as const;
export type MarketValuationQuality =
  (typeof MarketValuationQuality)[keyof typeof MarketValuationQuality];
export const MARKET_VALUATION_QUALITY_VALUES = Object.values(
  MarketValuationQuality,
);

export const MarketValuationSource = {
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const;
export type MarketValuationSource =
  (typeof MarketValuationSource)[keyof typeof MarketValuationSource];

export const MarketValuationFreshness = {
  CURRENT: "current",
  STALE: "stale",
  UNKNOWN: "unknown",
} as const;
export type MarketValuationFreshness =
  (typeof MarketValuationFreshness)[keyof typeof MarketValuationFreshness];

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

export const InvestmentHoldingReadStatus = {
  READY: "ready",
  NOT_FOUND: "not_found",
  ERROR: "error",
} as const;
export type InvestmentHoldingReadStatus =
  (typeof InvestmentHoldingReadStatus)[keyof typeof InvestmentHoldingReadStatus];

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

export const InvestmentInputCurrencyOperation = {
  OPENING_POSITION: InvestmentOperationType.OPENING_POSITION,
  INITIAL_PURCHASE: "initial_purchase",
  BUY: InvestmentOperationType.BUY,
  SELL: InvestmentOperationType.SELL,
  ASSET_CONVERSION: InvestmentOperationType.ASSET_CONVERSION,
  INVESTMENT_INCOME: InvestmentOperationType.INVESTMENT_INCOME,
  VALUATION: InvestmentActivityType.VALUATION,
} as const;
export type InvestmentInputCurrencyOperation =
  (typeof InvestmentInputCurrencyOperation)[keyof typeof InvestmentInputCurrencyOperation];

export const InvestmentInputCurrency = {
  VND: "VND",
  USDT: "USDT",
  USDC: "USDC",
} as const;
export type InvestmentInputCurrency =
  (typeof InvestmentInputCurrency)[keyof typeof InvestmentInputCurrency];
export const INVESTMENT_INPUT_CURRENCY_VALUES = Object.values(
  InvestmentInputCurrency,
);

export const InvestmentInputRateSource = {
  AUTOMATIC: "automatic",
  MANUAL: "manual",
  IDENTITY: "identity",
} as const;
export type InvestmentInputRateSource =
  (typeof InvestmentInputRateSource)[keyof typeof InvestmentInputRateSource];
export const INVESTMENT_INPUT_RATE_SOURCE_VALUES = Object.values(
  InvestmentInputRateSource,
);

export const InvestmentInputRateStatus = {
  CURRENT: "current",
  STALE: "stale",
  UNAVAILABLE: "unavailable",
} as const;
export type InvestmentInputRateStatus =
  (typeof InvestmentInputRateStatus)[keyof typeof InvestmentInputRateStatus];

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
export const INVESTMENT_INCOME_KIND_VALUES =
  Object.values(InvestmentIncomeKind);

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
  INITIAL_PURCHASE: "record_investment_initial_purchase",
  BUY: "record_investment_buy",
  SELL: "record_investment_sell",
  CONVERSION: "record_investment_conversion",
  INCOME: "record_investment_income",
  VALUATION: "record_investment_valuation",
} as const;
export type InvestmentRpc =
  | (typeof INVESTMENT_RPC)[keyof typeof INVESTMENT_RPC]
  | typeof INVESTMENT_INPUT_CURRENCY_RPC;
export const INVESTMENT_RPC_VALUES = Object.values(INVESTMENT_RPC);
export const INVESTMENT_INPUT_CURRENCY_RPC =
  "record_investment_with_input_currency";
export const INVESTMENT_QUERY_RPC = {
  HOME_RAW_INPUTS: "get_home_investment_raw_inputs",
} as const;
export const INVESTMENT_QUERY_PHASE = {
  HOME_RAW_INPUTS: "home_raw_inputs",
} as const;

export const INVESTMENT_OPERATION = {
  LIST_HOLDINGS: "listInvestmentHoldings",
  LIST_ACTIVITIES: "listInvestmentActivities",
  INPUT_CURRENCY_RATE: "investmentInputCurrencyRate",
} as const;

export const INVESTMENT_CREATE_IDEMPOTENCY_KEY_PREFIX = "investment:create";

export const InvestmentFormMode = {
  BUY: InvestmentOperationType.BUY,
  SELL: InvestmentOperationType.SELL,
  CONVERSION: InvestmentOperationType.ASSET_CONVERSION,
  INCOME: InvestmentOperationType.INVESTMENT_INCOME,
  VALUATION: InvestmentActivityType.VALUATION,
} as const;
export type InvestmentFormMode =
  (typeof InvestmentFormMode)[keyof typeof InvestmentFormMode];
export const INVESTMENT_FORM_MODE_VALUES = Object.values(InvestmentFormMode);

export const INVESTMENT_QUANTITY_SCALE = 18;
export const INVESTMENT_QUANTITY_STORAGE_PRECISION = 38;
export const INVESTMENT_MONEY_PRICE_DECIMAL_PLACES = 8;
export const INVESTMENT_REPORTING_CURRENCY = "VND";
export const INVESTMENT_INPUT_CURRENCY_DEFAULT = InvestmentInputCurrency.USDT;
export const INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES = [
  InvestmentInputCurrency.USDT,
  InvestmentInputCurrency.USDC,
] as const;
export const INVESTMENT_INPUT_CURRENCY_COINGECKO_IDS = {
  [InvestmentInputCurrency.USDT]: "tether",
  [InvestmentInputCurrency.USDC]: "usd-coin",
} as const;

export const MarketFxProvider = {
  FRANKFURTER: "FRANKFURTER",
  COINGECKO: "COINGECKO",
} as const;
export type MarketFxProvider =
  (typeof MarketFxProvider)[keyof typeof MarketFxProvider];
export const MARKET_FX_PROVIDER_VALUES = Object.values(MarketFxProvider);

export const MARKET_FX_OPERATION = {
  SYNC: "marketFxSync",
} as const;
export const MARKET_FX_TABLE = "market_currency_rates";
export const MARKET_FX_BASE_CURRENCY = "USD";
export const MARKET_FX_QUOTE_CURRENCY = INVESTMENT_REPORTING_CURRENCY;
export const MARKET_FX_STALE_AFTER_HOURS = 24;
export const MARKET_FX_PROVIDER_URL = "https://api.frankfurter.dev/v2/rate";
export const MARKET_FX_PAIR_LABEL = "USD/VND";

export const INVESTMENT_ERROR_CODE = {
  INVALID: "invalid",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  INSUFFICIENT_QUANTITY: "insufficient_quantity",
  BASIS_UNAVAILABLE: "basis_unavailable",
  CURRENCY_RATE_UNAVAILABLE: "currency_rate_unavailable",
  UNKNOWN: "unknown",
} as const;
export type InvestmentErrorCode =
  (typeof INVESTMENT_ERROR_CODE)[keyof typeof INVESTMENT_ERROR_CODE];

/**
 * Compatibility markers for the current investment RPCs, which still raise
 * plain-text PostgreSQL exceptions instead of structured domain metadata.
 */
export const INVESTMENT_LEGACY_RPC_ERROR_MARKERS = {
  INSUFFICIENT_QUANTITY: ["insufficient quantity"],
  NOT_FOUND: ["not found"],
  CURRENCY_RATE_UNAVAILABLE: ["investment currency rate unavailable"],
} as const;

export const INVESTMENT_RPC_CONTEXT_PARAM_TO_FIELD = {
  p_holding_id: "holdingId",
  p_source_holding_id: "sourceHoldingId",
  p_destination_holding_id: "destinationHoldingId",
  p_cash_account_id: "cashAccountId",
} as const;

export const InvestmentEntryMode = {
  HISTORICAL: "historical",
  PURCHASE: "purchase",
} as const;
export type InvestmentEntryMode =
  (typeof InvestmentEntryMode)[keyof typeof InvestmentEntryMode];
export const INVESTMENT_ENTRY_MODE_VALUES = Object.values(InvestmentEntryMode);

export const OpeningPositionStep = {
  TYPE: "type",
  DETAILS: "details",
  REVIEW: "review",
} as const;
export type OpeningPositionStep =
  (typeof OpeningPositionStep)[keyof typeof OpeningPositionStep];
export const OPENING_POSITION_STEP_VALUES = Object.values(OpeningPositionStep);

export const InvestmentOverviewFilter = {
  ALL: "all",
  STOCK: InvestmentAssetClass.STOCK,
  FUND: InvestmentAssetClass.FUND,
  CRYPTO: InvestmentAssetClass.CRYPTO,
  GOLD: InvestmentAssetClass.GOLD,
  BOND: InvestmentAssetClass.BOND,
} as const;
export type InvestmentOverviewFilter =
  (typeof InvestmentOverviewFilter)[keyof typeof InvestmentOverviewFilter];
export const INVESTMENT_OVERVIEW_FILTER_VALUES = Object.values(
  InvestmentOverviewFilter,
);

export const InvestmentHoldingsTab = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const;
export type InvestmentHoldingsTab =
  (typeof InvestmentHoldingsTab)[keyof typeof InvestmentHoldingsTab];
export const INVESTMENT_HOLDINGS_TAB_VALUES = [
  InvestmentHoldingsTab.ACTIVE,
  InvestmentHoldingsTab.CLOSED,
] as const;

export const INVESTMENT_VALIDATION_MESSAGE = {
  INVALID_CASH_FEE: "INVALID_CASH_FEE",
  INVALID_ASSET_FEE: "INVALID_ASSET_FEE",
  INVALID_FEE_HOLDING: "INVALID_FEE_HOLDING",
} as const;
