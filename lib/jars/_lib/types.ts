export type JarPreset = {
  name: string;
  slug: string;
  color: string;
  icon: string;
  jarType:
    | "essential"
    | "investment"
    | "long_term_saving"
    | "education"
    | "play"
    | "give";
  monthlyStrategy: "percent";
  incomePercent: number;
  spendPolicy:
    | "flexible"
    | "invest_only"
    | "long_term_only"
    | "must_spend"
    | "give_only";
  sortOrder: number;
};

export type JarSuggestion = {
  jarId: string;
  jarName: string;
  amount: number;
  reason: string;
};

export type JarReviewRow = {
  id: string;
  source_type: string;
  source_id: string;
  movement_date: string;
  month: string;
  amount: number;
  status: "pending" | "resolved" | "dismissed";
  suggested_allocations: JarSuggestion[];
  context_json: Record<string, unknown>;
  resolved_allocations: JarSuggestion[] | null;
};

export type JarRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  jar_type: string;
  monthly_strategy: string;
  spend_policy: string;
  sort_order: number;
  is_archived: boolean;
  goal_id: string | null;
};

export type JarPlanRow = {
  jar_id: string;
  month: string;
  fixed_amount: number;
  income_percent: number;
};

export type JarCurrentBalanceRow = {
  jar_id: string;
  total_inflow: number;
  total_outflow: number;
  current_balance: number;
  held_in_cash: number;
  held_in_savings: number;
  held_in_investments: number;
  held_in_assets: number;
};

export type JarMonthlyBalanceRow = {
  jar_id: string;
  month: string;
  inflow_amount: number;
  outflow_amount: number;
  net_change: number;
  fixed_target_amount: number;
  income_percent_target: number;
};
