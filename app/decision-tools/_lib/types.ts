export type SavedScenario = {
  id: string;
  scenario_type: string;
  name: string;
  created_at: string;
  result_computed_at: string | null;
  summary_json: Record<string, unknown> | null;
  timeseries_json: unknown[] | null;
  key_metrics_json: Record<string, unknown> | null;
};

export type TabKey =
  | "loan"
  | "purchase_timing"
  | "savings_projection"
  | "goal_modeling"
  | "debt_vs_invest";

export type LoanScenarioState = {
  principal: number;
  termYears: number;
  promoRate: number;
  promoMonths: number;
  floatingRate: number;
  extraPayment: number;
};

export type PurchaseTimingState = {
  currentPrice: number;
  priceGrowth: number;
  downPaymentRatio: number;
  loanRate: number;
  termYears: number;
  waitMonths: number;
  currentSavings: number;
  monthlySavings: number;
};

export type SavingsProjectionState = {
  startAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  startDelayMonths: number;
};

export type GoalModelingState = {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  monthsToGoal: number;
};

export type DebtVsInvestState = {
  debtPrincipal: number;
  debtRate: number;
  debtYears: number;
  monthlySurplus: number;
  investReturn: number;
  years: number;
};
