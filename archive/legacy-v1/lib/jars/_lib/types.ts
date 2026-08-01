// ---------------------------------------------------------------------------
// Movement type constants
// ---------------------------------------------------------------------------
export const JAR_MOVEMENT_TYPES = [
  "allocation_income",
  "allocation_manual",
  "expense_spend",
  "jar_transfer_out",
  "jar_transfer_in",
  "rollover_carry_forward",
  "rollover_sweep_out",
  "rollover_sweep_in",
  "overspend_cover_out",
  "overspend_cover_in",
  "correction_in",
  "correction_out",
  "snapshot_opening",
] as const;

export type JarMovementType = (typeof JAR_MOVEMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------
export const JAR_EVENT_TYPES = [
  "allocation.auto_resolved",
  "allocation.review_created",
  "allocation.manual_resolved",
  "jar.created",
  "jar.updated",
  "jar.archived",
  "jar.transfer_created",
  "month_close.previewed",
  "month_close.approved",
  "overspend.covered",
  "rule.changed",
  "rule.bulk_updated",
  "correction.created",
  "snapshot.generated",
] as const;

export type JarEventType = (typeof JAR_EVENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Policy constants
// ---------------------------------------------------------------------------
export const OVERSPEND_POLICIES = ["warn", "block", "allow_negative"] as const;
export type OverspendPolicy = (typeof OVERSPEND_POLICIES)[number];

export const INCOME_AUTO_ALLOCATE_MODES = [
  "off",
  "suggest",
  "auto_high_confidence",
] as const;
export type IncomeAutoAllocateMode =
  (typeof INCOME_AUTO_ALLOCATE_MODES)[number];

export const EXPENSE_AUTO_ALLOCATE_MODES = ["off", "auto_mapped_only"] as const;
export type ExpenseAutoAllocateMode =
  (typeof EXPENSE_AUTO_ALLOCATE_MODES)[number];

export const MONTH_CLOSE_MODES = ["manual", "assisted"] as const;
export type MonthCloseMode = (typeof MONTH_CLOSE_MODES)[number];

export const CLOSE_RUN_STATUSES = [
  "draft",
  "processing",
  "approved",
  "failed",
] as const;
export type CloseRunStatus = (typeof CLOSE_RUN_STATUSES)[number];

export const CATEGORY_RULE_ASSIGNMENT_TYPES = [
  "manual",
  "auto_migrated_v2_rule",
  "auto_migrated_legacy_spending",
] as const;
export type CategoryRuleAssignmentType =
  (typeof CATEGORY_RULE_ASSIGNMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Domain entity types
// ---------------------------------------------------------------------------
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
  priority: number;
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

export type JarMovementRow = {
  id: string;
  household_id: string;
  jar_id: string;
  review_queue_id: string | null;
  movement_date: string;
  month: string;
  amount: number;
  balance_delta: -1 | 0 | 1;
  location_from: string | null;
  location_to: string | null;
  source_type: string;
  source_id: string;
  source_line_key: string;
  related_transaction_id: string | null;
  related_savings_id: string | null;
  movement_type: JarMovementType | null;
  idempotency_key: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JarCategoryRuleRow = {
  id: string;
  household_id: string;
  category_id: string;
  jar_id: string;
  assignment_type: CategoryRuleAssignmentType;
  confidence: "high" | "suggested";
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JarEventRow = {
  id: string;
  household_id: string;
  jar_id: string | null;
  event_type: JarEventType;
  source_type: string | null;
  source_id: string | null;
  idempotency_key: string | null;
  occurred_at: string;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
};

export type JarMonthlySnapshotRow = {
  id: string;
  household_id: string;
  jar_id: string;
  month: string;
  opening_balance: number;
  planned_amount: number;
  allocated_amount: number;
  spent_amount: number;
  transfer_in_amount: number;
  transfer_out_amount: number;
  rollover_in_amount: number;
  rollover_out_amount: number;
  overspend_cover_in_amount: number;
  overspend_cover_out_amount: number;
  correction_amount: number;
  closing_balance_before_rollover: number;
  closing_balance: number;
  closed_at: string;
  closed_by: string | null;
  source_close_run_id: string | null;
};

export type JarMonthCloseRunRow = {
  id: string;
  household_id: string;
  month: string;
  status: CloseRunStatus;
  preview_json: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type JarHouseholdPolicyRow = {
  id: string;
  household_id: string;
  overspend_policy: OverspendPolicy;
  income_auto_allocate: IncomeAutoAllocateMode;
  expense_auto_allocate: ExpenseAutoAllocateMode;
  month_close_mode: MonthCloseMode;
  created_at: string;
  updated_at: string;
};
