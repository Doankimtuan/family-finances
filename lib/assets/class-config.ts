/**
 * Centralized asset-class configuration.
 * Drives form fields, labels, icons, defaults, and cashflow semantics
 * across the investment asset management feature.
 */

export type AssetClassKey =
  | "gold"
  | "mutual_fund"
  | "stock"
  | "real_estate"
  | "savings_deposit"
  | "crypto"
  | "vehicle"
  | "cash_equivalent"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type ValuationMethod = "manual" | "api" | "appraisal" | "calculated";

export type CashflowFlowType =
  | "contribution"
  | "withdrawal"
  | "income"
  | "fee"
  | "tax";

export type MetadataFieldDef = {
  key: string;
  labelKey: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; labelKey: string }[];
  placeholderKey?: string;
};

export type AssetClassConfig = {
  key: AssetClassKey;
  labelKey: string;
  iconName: string;
  defaultUnitLabel: string;
  defaultLiquid: boolean;
  defaultRisk: RiskLevel;
  defaultValuationMethod: ValuationMethod;
  isInvestmentTracker: boolean;
  cashflowLabels: Record<CashflowFlowType, string>;
  metadataFields: MetadataFieldDef[];
};

const SHARED_CASHFLOW_LABELS: AssetClassConfig["cashflowLabels"] = {
  contribution: "assets.contribution",
  withdrawal: "assets.withdrawal",
  income: "assets.income",
  fee: "assets.fee",
  tax: "assets.tax",
};

export const ASSET_CLASS_CONFIGS: Record<AssetClassKey, AssetClassConfig> = {
  real_estate: {
    key: "real_estate",
    labelKey: "assets.class.real_estate",
    iconName: "Home",
    defaultUnitLabel: "căn",
    defaultLiquid: false,
    defaultRisk: "medium",
    defaultValuationMethod: "appraisal",
    isInvestmentTracker: true,
    cashflowLabels: {
      contribution: "assets.cashflow.real_estate.contribution",
      withdrawal: "assets.cashflow.real_estate.withdrawal",
      income: "assets.cashflow.real_estate.income",
      fee: "assets.cashflow.real_estate.fee",
      tax: "assets.cashflow.real_estate.tax",
    },
    metadataFields: [
      { key: "address", labelKey: "assets.field.address", type: "text" },
      {
        key: "property_type",
        labelKey: "assets.field.property_type",
        type: "select",
        options: [
          { value: "apartment", labelKey: "assets.option.apartment" },
          { value: "house", labelKey: "assets.option.house" },
          { value: "land", labelKey: "assets.option.land" },
          { value: "commercial", labelKey: "assets.option.commercial" },
          { value: "other", labelKey: "assets.option.other" },
        ],
      },
      { key: "area_sqm", labelKey: "assets.field.area_sqm", type: "number" },
      {
        key: "ownership_pct",
        labelKey: "assets.field.ownership_pct",
        type: "number",
      },
      {
        key: "rental_status",
        labelKey: "assets.field.rental_status",
        type: "select",
        options: [
          { value: "vacant", labelKey: "assets.option.vacant" },
          { value: "rented", labelKey: "assets.option.rented" },
          { value: "owner_occupied", labelKey: "assets.option.owner_occupied" },
        ],
      },
    ],
  },

  mutual_fund: {
    key: "mutual_fund",
    labelKey: "assets.class.mutual_fund",
    iconName: "TrendingUp",
    defaultUnitLabel: "CCQ",
    defaultLiquid: true,
    defaultRisk: "medium",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: "assets.cashflow.mutual_fund.income",
    },
    metadataFields: [
      { key: "fund_code", labelKey: "assets.field.fund_code", type: "text", placeholderKey: "assets.field.fund_code" },
      { key: "fund_manager", labelKey: "assets.field.fund_manager", type: "text" },
      { key: "platform", labelKey: "assets.field.platform", type: "text", placeholderKey: "assets.field.platform" },
      {
        key: "fund_type",
        labelKey: "assets.field.fund_type",
        type: "select",
        options: [
          { value: "equity", labelKey: "assets.option.equity" },
          { value: "bond", labelKey: "assets.option.bond" },
          { value: "balanced", labelKey: "assets.option.balanced" },
          { value: "money_market", labelKey: "assets.option.money_market" },
        ],
      },
    ],
  },

  gold: {
    key: "gold",
    labelKey: "assets.class.gold",
    iconName: "Coins",
    defaultUnitLabel: "lượng",
    defaultLiquid: true,
    defaultRisk: "low",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      contribution: "assets.cashflow.gold.contribution",
      withdrawal: "assets.cashflow.gold.withdrawal",
    },
    metadataFields: [
      {
        key: "gold_form",
        labelKey: "assets.field.gold_form",
        type: "select",
        options: [
          { value: "bar_sjc", labelKey: "assets.option.bar_sjc" },
          { value: "bar_other", labelKey: "assets.option.bar_other" },
          { value: "ring", labelKey: "assets.option.ring" },
          { value: "jewelry", labelKey: "assets.option.jewelry" },
        ],
      },
      {
        key: "purity",
        labelKey: "assets.field.purity",
        type: "select",
        options: [
          { value: "9999", labelKey: "assets.option.9999" },
          { value: "999", labelKey: "assets.option.999" },
          { value: "750", labelKey: "assets.option.750" },
          { value: "other", labelKey: "assets.option.other" },
        ],
      },
      { key: "storage_location", labelKey: "assets.field.storage_location", type: "text" },
    ],
  },

  crypto: {
    key: "crypto",
    labelKey: "assets.class.crypto",
    iconName: "Bitcoin",
    defaultUnitLabel: "coin",
    defaultLiquid: true,
    defaultRisk: "very_high",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: "assets.cashflow.crypto.income",
      fee: "assets.cashflow.crypto.fee",
    },
    metadataFields: [
      { key: "symbol", labelKey: "assets.field.symbol", type: "text", placeholderKey: "assets.field.symbol" },
      { key: "network", labelKey: "assets.field.network", type: "text", placeholderKey: "assets.field.network" },
      {
        key: "custody_type",
        labelKey: "assets.field.custody_type",
        type: "select",
        options: [
          { value: "exchange", labelKey: "assets.option.exchange" },
          { value: "hot_wallet", labelKey: "assets.option.hot_wallet" },
          { value: "cold_wallet", labelKey: "assets.option.cold_wallet" },
        ],
      },
      { key: "wallet_exchange", labelKey: "assets.field.wallet_exchange", type: "text", placeholderKey: "assets.field.wallet_exchange" },
      {
        key: "is_staking",
        labelKey: "assets.field.is_staking",
        type: "boolean",
      },
    ],
  },

  stock: {
    key: "stock",
    labelKey: "assets.class.stock",
    iconName: "TrendingUp",
    defaultUnitLabel: "cp",
    defaultLiquid: true,
    defaultRisk: "high",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: "assets.cashflow.stock.income",
    },
    metadataFields: [
      { key: "ticker", labelKey: "assets.field.ticker", type: "text", placeholderKey: "assets.field.ticker" },
      { key: "exchange", labelKey: "assets.field.exchange", type: "text", placeholderKey: "assets.field.exchange" },
      { key: "broker", labelKey: "assets.field.broker", type: "text" },
    ],
  },

  savings_deposit: {
    key: "savings_deposit",
    labelKey: "assets.class.savings_deposit",
    iconName: "PiggyBank",
    defaultUnitLabel: "sổ",
    defaultLiquid: false,
    defaultRisk: "low",
    defaultValuationMethod: "calculated",
    isInvestmentTracker: false,
    cashflowLabels: SHARED_CASHFLOW_LABELS,
    metadataFields: [],
  },

  vehicle: {
    key: "vehicle",
    labelKey: "assets.class.vehicle",
    iconName: "Car",
    defaultUnitLabel: "xe",
    defaultLiquid: false,
    defaultRisk: "low",
    defaultValuationMethod: "manual",
    isInvestmentTracker: false,
    cashflowLabels: SHARED_CASHFLOW_LABELS,
    metadataFields: [],
  },

  cash_equivalent: {
    key: "cash_equivalent",
    labelKey: "assets.class.cash_equivalent",
    iconName: "Banknote",
    defaultUnitLabel: "unit",
    defaultLiquid: true,
    defaultRisk: "low",
    defaultValuationMethod: "manual",
    isInvestmentTracker: false,
    cashflowLabels: SHARED_CASHFLOW_LABELS,
    metadataFields: [],
  },

  other: {
    key: "other",
    labelKey: "assets.class.other",
    iconName: "TrendingUp",
    defaultUnitLabel: "unit",
    defaultLiquid: false,
    defaultRisk: "medium",
    defaultValuationMethod: "manual",
    isInvestmentTracker: false,
    cashflowLabels: SHARED_CASHFLOW_LABELS,
    metadataFields: [],
  },
};

/** Investment asset classes (shown in investment dashboards) */
export const INVESTMENT_CLASSES: AssetClassKey[] = [
  "real_estate",
  "mutual_fund",
  "gold",
  "crypto",
  "stock",
];

/** Get config for a class key, falling back to 'other' */
export function getAssetClassConfig(
  cls: string,
): AssetClassConfig {
  return (
    ASSET_CLASS_CONFIGS[cls as AssetClassKey] ?? ASSET_CLASS_CONFIGS.other
  );
}

/** Get localized label */
export function getClassLabel(cls: string, t: (key: string) => string): string {
  const cfg = getAssetClassConfig(cls);
  return t(cfg.labelKey);
}

/** Get localized cashflow label */
export function getCashflowLabel(
  cls: string,
  flowType: CashflowFlowType,
  t: (key: string) => string,
): string {
  const cfg = getAssetClassConfig(cls);
  const labelKey = cfg.cashflowLabels[flowType];
  return labelKey ? t(labelKey) : flowType;
}
