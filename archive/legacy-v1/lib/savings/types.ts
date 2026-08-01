export type SavingsType = "bank" | "third_party";
export type SavingsInterestType = "simple" | "compound_daily";
export type SavingsTermMode = "fixed" | "flexible";
export type SavingsStatus =
  | "active"
  | "maturing_soon"
  | "matured"
  | "withdrawn"
  | "renewed"
  | "cancelled";
export type SavingsMaturityPreference =
  | "renew_same"
  | "switch_plan"
  | "withdraw";

export type SavingsAccountRow = {
  id: string;
  household_id: string;
  parent_id: string | null;
  goal_id: string | null;
  savings_type: SavingsType;
  provider_name: string;
  product_name: string | null;
  interest_type: SavingsInterestType;
  term_mode: SavingsTermMode;
  term_days: number;
  principal_amount: number;
  current_principal_remaining: number;
  annual_rate: number;
  early_withdrawal_rate: number | null;
  tax_rate: number;
  start_date: string;
  maturity_date: string | null;
  primary_linked_account_id: string;
  linked_account_ids: string[];
  maturity_preference: SavingsMaturityPreference | null;
  next_plan_config: Record<string, unknown>;
  status: SavingsStatus;
  closed_at: string | null;
  origin_rate_history_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SavingsWithdrawalRow = {
  id: string;
  savings_account_id: string;
  household_id: string;
  withdrawal_date: string;
  withdrawal_mode: "partial" | "full";
  requested_principal_amount: number;
  gross_interest_amount: number;
  tax_amount: number;
  penalty_amount: number;
  net_received_amount: number;
  destination_account_id: string;
  remaining_principal_after: number;
  principal_transaction_id: string | null;
  interest_transaction_id: string | null;
  tax_transaction_id: string | null;
  penalty_transaction_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type SavingsRateHistoryRow = {
  id: string;
  household_id: string;
  provider_name: string;
  product_name: string | null;
  savings_type: SavingsType;
  interest_type: SavingsInterestType;
  term_mode: SavingsTermMode;
  term_days: number;
  annual_rate: number;
  early_withdrawal_rate: number | null;
  tax_rate: number;
  effective_from: string;
  effective_to: string | null;
  source: "manual" | "imported" | "system_renewal";
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type SavingsMaturityActionRow = {
  id: string;
  savings_account_id: string;
  household_id: string;
  action_date: string;
  action_type: SavingsMaturityPreference;
  execution_mode: "manual" | "scheduled_auto";
  gross_principal_amount: number;
  gross_interest_amount: number;
  tax_amount: number;
  net_rollover_amount: number;
  destination_account_id: string | null;
  child_savings_account_id: string | null;
  applied_annual_rate: number | null;
  applied_term_days: number | null;
  applied_interest_type: SavingsInterestType | null;
  selected_rate_history_id: string | null;
  executed_by: string | null;
  notes: string | null;
  created_at: string;
};

export type SavingsComputedValue = {
  principal: number;
  accruedInterest: number;
  taxLiability: number;
  grossValue: number;
  netValue: number;
  liquidationValue: number;
  daysElapsed: number;
};

export type SavingsProjectionPoint = {
  date: string;
  principal: number;
  accruedInterest: number;
  netValue: number;
};

export type SavingsListItem = {
  id: string;
  providerName: string;
  productName: string | null;
  savingsType: SavingsType;
  interestType: SavingsInterestType;
  termMode: SavingsTermMode;
  principalAmount: number;
  currentPrincipalRemaining: number;
  annualRate: number;
  taxRate: number;
  startDate: string;
  maturityDate: string | null;
  status: SavingsStatus;
  uiStatus: "ACTIVE" | "MATURING_SOON" | "MATURED" | "WITHDRAWN";
  goalId: string | null;
  goalName: string | null;
  currentValue: SavingsComputedValue;
  daysUntilMaturity: number | null;
  totalTermDays: number | null;
  elapsedTermDays: number | null;
};

export type SavingsSummary = {
  totalGrossValue: number;
  totalLiquidationValue: number;
  totalAccruedInterest: number;
  upcomingCount30d: number;
  nextMaturity: { id: string; providerName: string; maturityDate: string; grossValue: number } | null;
  goalLinkedValue: number;
  byType: Record<SavingsType, number>;
};
