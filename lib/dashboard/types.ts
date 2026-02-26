export type DashboardCoreMetrics = {
  household_id: string;
  as_of_date: string;
  month_start: string;
  month_end: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_savings: number;
  savings_rate: number | null;
  emergency_months: number | null;
  debt_service_ratio: number | null;
};

export type DashboardTrendPoint = {
  household_id: string;
  month: string;
  net_worth: number;
  income: number;
  expense: number;
  savings: number;
  savings_rate: number | null;
  emergency_months: number | null;
  debt_service_ratio: number | null;
};

export type DashboardCoreResponse = {
  metrics: DashboardCoreMetrics | null;
  trend: DashboardTrendPoint[];
  health: {
    snapshotMonth: string;
    overallScore: number;
    factorScores: {
      cashflow: number;
      emergency: number;
      debt: number;
      networth: number;
      goals: number;
      diversification: number;
    };
    topAction: string;
    metrics: Record<string, number | null>;
  } | null;
};
