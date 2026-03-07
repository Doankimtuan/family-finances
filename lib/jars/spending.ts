export type SpendingJarAlertLevel = "normal" | "warning" | "exceeded";

export type SpendingJarSummaryRow = {
  jar_id: string;
  jar_name: string;
  month: string;
  monthly_limit: number;
  monthly_spent: number;
  usage_percent: number | null;
  alert_level: SpendingJarAlertLevel;
};

export type SpendingJarHistoryRow = SpendingJarSummaryRow;

export type SpendingJarTxnRow = {
  entry_id: string;
  source_type: "transaction" | "card_standard" | "card_installment";
  entry_date: string;
  description: string;
  category_id: string | null;
  category_name: string | null;
  amount: number;
};

export type SpendingJarCategoryBreakdownRow = {
  category_id: string | null;
  category_name: string;
  amount: number;
};

export type SpendingJarAlert = {
  jarId: string;
  jarName: string;
  usagePercent: number | null;
  alertLevel: SpendingJarAlertLevel;
  spent: number;
  limit: number;
};
