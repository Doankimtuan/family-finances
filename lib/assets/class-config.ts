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
  labelVi: string;
  labelEn: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; labelVi: string; labelEn: string }[];
  placeholder?: string;
};

export type AssetClassConfig = {
  key: AssetClassKey;
  labelVi: string;
  labelEn: string;
  iconName: string;
  defaultUnitLabel: string;
  defaultLiquid: boolean;
  defaultRisk: RiskLevel;
  defaultValuationMethod: ValuationMethod;
  isInvestmentTracker: boolean;
  cashflowLabels: Record<CashflowFlowType, { vi: string; en: string }>;
  metadataFields: MetadataFieldDef[];
};

const SHARED_CASHFLOW_LABELS: AssetClassConfig["cashflowLabels"] = {
  contribution: { vi: "Đóng góp/Mua", en: "Buy / Contribute" },
  withdrawal: { vi: "Rút tiền/Bán", en: "Sell / Withdraw" },
  income: { vi: "Thu nhập", en: "Income" },
  fee: { vi: "Phí", en: "Fee" },
  tax: { vi: "Thuế", en: "Tax" },
};

export const ASSET_CLASS_CONFIGS: Record<AssetClassKey, AssetClassConfig> = {
  real_estate: {
    key: "real_estate",
    labelVi: "Bất động sản",
    labelEn: "Real Estate",
    iconName: "Home",
    defaultUnitLabel: "căn",
    defaultLiquid: false,
    defaultRisk: "medium",
    defaultValuationMethod: "appraisal",
    isInvestmentTracker: true,
    cashflowLabels: {
      contribution: { vi: "Mua / Đặt cọc", en: "Purchase / Deposit" },
      withdrawal: { vi: "Bán / Rút vốn", en: "Sale / Withdrawal" },
      income: { vi: "Tiền thuê", en: "Rental Income" },
      fee: { vi: "Phí quản lý / Bảo trì", en: "Mgmt / Maintenance" },
      tax: { vi: "Thuế BĐS", en: "Property Tax" },
    },
    metadataFields: [
      { key: "address", labelVi: "Địa chỉ", labelEn: "Address", type: "text" },
      {
        key: "property_type",
        labelVi: "Loại BĐS",
        labelEn: "Property Type",
        type: "select",
        options: [
          { value: "apartment", labelVi: "Chung cư", labelEn: "Apartment" },
          { value: "house", labelVi: "Nhà phố", labelEn: "House" },
          { value: "land", labelVi: "Đất nền", labelEn: "Land" },
          { value: "commercial", labelVi: "Thương mại", labelEn: "Commercial" },
          { value: "other", labelVi: "Khác", labelEn: "Other" },
        ],
      },
      { key: "area_sqm", labelVi: "Diện tích (m²)", labelEn: "Area (sqm)", type: "number" },
      {
        key: "ownership_pct",
        labelVi: "Tỷ lệ sở hữu (%)",
        labelEn: "Ownership %",
        type: "number",
      },
      {
        key: "rental_status",
        labelVi: "Trạng thái cho thuê",
        labelEn: "Rental Status",
        type: "select",
        options: [
          { value: "vacant", labelVi: "Trống", labelEn: "Vacant" },
          { value: "rented", labelVi: "Đang cho thuê", labelEn: "Rented" },
          { value: "owner_occupied", labelVi: "Tự ở", labelEn: "Owner-occupied" },
        ],
      },
    ],
  },

  mutual_fund: {
    key: "mutual_fund",
    labelVi: "Quỹ mở",
    labelEn: "Mutual Fund",
    iconName: "TrendingUp",
    defaultUnitLabel: "CCQ",
    defaultLiquid: true,
    defaultRisk: "medium",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: { vi: "Cổ tức / Phân phối", en: "Dividend / Distribution" },
    },
    metadataFields: [
      { key: "fund_code", labelVi: "Mã quỹ", labelEn: "Fund Code", type: "text", placeholder: "VD: VESAF" },
      { key: "fund_manager", labelVi: "Công ty quản lý", labelEn: "Fund Manager", type: "text" },
      { key: "platform", labelVi: "Nền tảng mua", labelEn: "Platform", type: "text", placeholder: "VD: Fmarket, Stox" },
      {
        key: "fund_type",
        labelVi: "Loại quỹ",
        labelEn: "Fund Type",
        type: "select",
        options: [
          { value: "equity", labelVi: "Cổ phiếu", labelEn: "Equity" },
          { value: "bond", labelVi: "Trái phiếu", labelEn: "Bond" },
          { value: "balanced", labelVi: "Cân bằng", labelEn: "Balanced" },
          { value: "money_market", labelVi: "Thị trường tiền tệ", labelEn: "Money Market" },
        ],
      },
    ],
  },

  gold: {
    key: "gold",
    labelVi: "Vàng",
    labelEn: "Gold",
    iconName: "Coins",
    defaultUnitLabel: "lượng",
    defaultLiquid: true,
    defaultRisk: "low",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      contribution: { vi: "Mua vàng", en: "Buy Gold" },
      withdrawal: { vi: "Bán vàng", en: "Sell Gold" },
    },
    metadataFields: [
      {
        key: "gold_form",
        labelVi: "Hình thức",
        labelEn: "Form",
        type: "select",
        options: [
          { value: "bar_sjc", labelVi: "Vàng miếng SJC", labelEn: "SJC Bar" },
          { value: "bar_other", labelVi: "Vàng miếng khác", labelEn: "Other Bar" },
          { value: "ring", labelVi: "Nhẫn vàng", labelEn: "Gold Ring" },
          { value: "jewelry", labelVi: "Trang sức", labelEn: "Jewelry" },
        ],
      },
      {
        key: "purity",
        labelVi: "Tuổi vàng",
        labelEn: "Purity",
        type: "select",
        options: [
          { value: "9999", labelVi: "99.99%", labelEn: "99.99%" },
          { value: "999", labelVi: "99.9%", labelEn: "99.9%" },
          { value: "750", labelVi: "75% (18K)", labelEn: "75% (18K)" },
          { value: "other", labelVi: "Khác", labelEn: "Other" },
        ],
      },
      { key: "storage_location", labelVi: "Nơi cất giữ", labelEn: "Storage Location", type: "text" },
    ],
  },

  crypto: {
    key: "crypto",
    labelVi: "Tiền mã hóa",
    labelEn: "Cryptocurrency",
    iconName: "Bitcoin",
    defaultUnitLabel: "coin",
    defaultLiquid: true,
    defaultRisk: "very_high",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: { vi: "Staking / Reward", en: "Staking / Reward" },
      fee: { vi: "Phí giao dịch / Gas", en: "Transaction / Gas Fee" },
    },
    metadataFields: [
      { key: "symbol", labelVi: "Mã coin", labelEn: "Symbol", type: "text", placeholder: "VD: BTC, ETH" },
      { key: "network", labelVi: "Mạng blockchain", labelEn: "Network", type: "text", placeholder: "VD: Bitcoin, Ethereum" },
      {
        key: "custody_type",
        labelVi: "Hình thức lưu trữ",
        labelEn: "Custody",
        type: "select",
        options: [
          { value: "exchange", labelVi: "Sàn giao dịch", labelEn: "Exchange" },
          { value: "hot_wallet", labelVi: "Ví nóng", labelEn: "Hot Wallet" },
          { value: "cold_wallet", labelVi: "Ví lạnh", labelEn: "Cold Wallet" },
        ],
      },
      { key: "wallet_exchange", labelVi: "Ví / Sàn", labelEn: "Wallet / Exchange", type: "text", placeholder: "VD: Binance, Metamask" },
      {
        key: "is_staking",
        labelVi: "Đang staking",
        labelEn: "Staking",
        type: "boolean",
      },
    ],
  },

  stock: {
    key: "stock",
    labelVi: "Cổ phiếu",
    labelEn: "Stock",
    iconName: "TrendingUp",
    defaultUnitLabel: "cp",
    defaultLiquid: true,
    defaultRisk: "high",
    defaultValuationMethod: "manual",
    isInvestmentTracker: true,
    cashflowLabels: {
      ...SHARED_CASHFLOW_LABELS,
      income: { vi: "Cổ tức", en: "Dividend" },
    },
    metadataFields: [
      { key: "ticker", labelVi: "Mã CK", labelEn: "Ticker", type: "text", placeholder: "VD: VNM, FPT" },
      { key: "exchange", labelVi: "Sàn", labelEn: "Exchange", type: "text", placeholder: "VD: HOSE, HNX" },
      { key: "broker", labelVi: "Công ty CK", labelEn: "Broker", type: "text" },
    ],
  },

  savings_deposit: {
    key: "savings_deposit",
    labelVi: "Tiền gửi tiết kiệm",
    labelEn: "Savings Deposit",
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
    labelVi: "Phương tiện",
    labelEn: "Vehicle",
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
    labelVi: "Tương đương tiền mặt",
    labelEn: "Cash Equivalent",
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
    labelVi: "Khác",
    labelEn: "Other",
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
export function getClassLabel(cls: string, vi: boolean): string {
  const cfg = getAssetClassConfig(cls);
  return vi ? cfg.labelVi : cfg.labelEn;
}

/** Get localized cashflow label */
export function getCashflowLabel(
  cls: string,
  flowType: CashflowFlowType,
  vi: boolean,
): string {
  const cfg = getAssetClassConfig(cls);
  const labels = cfg.cashflowLabels[flowType];
  return labels ? (vi ? labels.vi : labels.en) : flowType;
}
