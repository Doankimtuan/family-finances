// ─── Row types used across accounts page sections ──────────────────────────

export type AccountRow = {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
};

export type AssetRow = {
  id: string;
  name: string;
  asset_class: string;
  unit_label: string;
  quantity: number;
  is_liquid: boolean;
};

export type LiabilityRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
  principal_original: number;
  start_date: string;
  term_months: number | null;
  next_payment_date: string | null;
  promo_rate_annual: number | null;
  floating_rate_margin: number | null;
  lender_name: string | null;
};

export type CardSettingsRow = {
  account_id: string;
  credit_limit: number;
  statement_day: number;
  due_day: number;
  linked_bank_account_id: string | null;
};

export type RateRow = {
  liability_id: string;
  annual_rate: number;
  period_start: string;
  period_end: string | null;
  is_promotional: boolean;
};

// ─── Derived data passed from page to section components ───────────────────

export type CardBillingInfo = {
  outstanding: number;
  installmentCount: number;
  dueDate: string | null;
};

export type AssetPriceInfo = {
  price: number;
  prevPrice: number;
  lastUpdated: string | undefined;
};

// ─── Aggregated summary passed to hero + sticky bar ────────────────────────

export type MoneySummary = {
  totalAccountBalance: number;
  totalCardDebt: number;
  totalAssetValue: number;
  totalSavingsValue: number;
  totalLiabilities: number;
  totalAssets: number;
  netWorth: number;
};
