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
    weights: {
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
  drilldowns: {
    netWorth: {
      assets: Array<{ label: string; value: number; source: string }>;
      liabilities: Array<{ label: string; value: number; source: string }>;
    };
    cashFlow: {
      income: Array<{
        label: string;
        value: number;
        source: string;
        color?: string | null;
      }>;
      expense: Array<{
        label: string;
        value: number;
        source: string;
        color?: string | null;
      }>;
      monthStart: string;
      monthEnd: string;
    };
  } | null;
  goals?: Array<{
    id: string;
    name: string;
    current_amount: number;
    target_amount: number;
    target_date: string | null;
    status: string;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    transaction_date: string;
    description: string | null;
    category_name: string | null;
  }>;
  priorityActions?: Array<{
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: string;
    priority: "high" | "medium" | "low";
  }>;
  jars?: Array<{
    jar_id: string;
    name: string;
    color: string | null;
    icon: string | null;
    target_amount: number;
    allocated_amount: number;
    withdrawn_amount: number;
    net_amount: number;
    coverage_ratio: number;
  }>;
};
