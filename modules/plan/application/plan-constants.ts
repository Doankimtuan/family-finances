/**
 * Plan domain constants — jars, goals, recurring, ritual.
 */

import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";

export {
  IncomeAllocateMode,
  RitualMode,
  INCOME_ALLOCATE_MODE_VALUES,
  RITUAL_MODE_VALUES,
} from "@/modules/tenancy/application/household-policy-constants";

export const JarKind = {
  SPENDING: "spending",
  SAVINGS: "savings",
  BUFFER: "buffer",
  INCOME: "income",
} as const;

export type JarKind = (typeof JarKind)[keyof typeof JarKind];

export const JAR_KIND_VALUES = [
  JarKind.SPENDING,
  JarKind.SAVINGS,
  JarKind.BUFFER,
  JarKind.INCOME,
] as const;

export const JarState = {
  ACTIVE: "active",
  PAUSED: "paused",
  ARCHIVED: "archived",
} as const;

export type JarState = (typeof JarState)[keyof typeof JarState];

export const JAR_STATE_VALUES = [
  JarState.ACTIVE,
  JarState.PAUSED,
  JarState.ARCHIVED,
] as const;

export const JarPlanKind = {
  PERCENT: "percent",
  FIXED: "fixed",
} as const;

export type JarPlanKind = (typeof JarPlanKind)[keyof typeof JarPlanKind];

export const JAR_PLAN_KIND_VALUES = [
  JarPlanKind.PERCENT,
  JarPlanKind.FIXED,
] as const;

/** Plan V2 envelope rollover behavior (not a savings balance). */
export const JarRolloverMode = {
  RESET: "reset",
  CARRY: "carry",
} as const;

export type JarRolloverMode =
  (typeof JarRolloverMode)[keyof typeof JarRolloverMode];

export const JAR_ROLLOVER_MODE_VALUES = [
  JarRolloverMode.RESET,
  JarRolloverMode.CARRY,
] as const;

export const GoalStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const GOAL_STATUS_VALUES = [
  GoalStatus.ACTIVE,
  GoalStatus.PAUSED,
  GoalStatus.READY,
  GoalStatus.COMPLETED,
  GoalStatus.CANCELLED,
] as const;

export const GOAL_FUNDING_LINKABLE_STATUS_VALUES = [
  GoalStatus.ACTIVE,
  GoalStatus.READY,
] as const;

export const GoalType = {
  SAVE_UP: "save_up",
  INVEST: "invest",
  PAYOFF: "payoff",
} as const;

export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GOAL_TYPE_VALUES = [
  GoalType.SAVE_UP,
  GoalType.INVEST,
  GoalType.PAYOFF,
] as const;

export const GoalFundingSourceKind = {
  SAVING: "saving",
  SAVINGS_ACCOUNT: "savings_account",
  HOLDING: "holding",
  LOAN: "loan",
  DEBT: "debt",
} as const;

export type GoalFundingSourceKind =
  (typeof GoalFundingSourceKind)[keyof typeof GoalFundingSourceKind];

export const GOAL_FUNDING_SOURCE_KIND_VALUES = [
  GoalFundingSourceKind.SAVING,
  GoalFundingSourceKind.SAVINGS_ACCOUNT,
  GoalFundingSourceKind.HOLDING,
  GoalFundingSourceKind.LOAN,
  GoalFundingSourceKind.DEBT,
] as const;

/** Per-source Money value freshness for linked goal funding. */
export const GoalFundingValueStatus = {
  CURRENT: "current",
  STALE: "stale",
  MISSING: "missing",
  INCOMPLETE: "incomplete",
  UNAVAILABLE: "unavailable",
} as const;

export type GoalFundingValueStatus =
  (typeof GoalFundingValueStatus)[keyof typeof GoalFundingValueStatus];

export const GOAL_FUNDING_VALUE_STATUS_VALUES = [
  GoalFundingValueStatus.CURRENT,
  GoalFundingValueStatus.STALE,
  GoalFundingValueStatus.MISSING,
  GoalFundingValueStatus.INCOMPLETE,
  GoalFundingValueStatus.UNAVAILABLE,
] as const;

/** Aggregate funding quality across all linked sources on a goal. */
export const GoalFundingQuality = {
  CURRENT: "current",
  STALE: "stale",
  PARTIAL: "partial",
  MISSING: "missing",
  INCOMPLETE: "incomplete",
} as const;

export type GoalFundingQuality =
  (typeof GoalFundingQuality)[keyof typeof GoalFundingQuality];

export const GOAL_FUNDING_QUALITY_VALUES = [
  GoalFundingQuality.CURRENT,
  GoalFundingQuality.STALE,
  GoalFundingQuality.PARTIAL,
  GoalFundingQuality.MISSING,
  GoalFundingQuality.INCOMPLETE,
] as const;

/** How a goal is backed by Money sources vs legacy manual progress. */
export const GoalBackingState = {
  LINKED: "linked",
  LEGACY: "legacy",
  NEEDS_BACKING: "needs_backing",
} as const;

export type GoalBackingState =
  (typeof GoalBackingState)[keyof typeof GoalBackingState];

export const GOAL_BACKING_STATE_VALUES = [
  GoalBackingState.LINKED,
  GoalBackingState.LEGACY,
  GoalBackingState.NEEDS_BACKING,
] as const;

/** Availability of a linked goal funding source at read time. */
export const GoalFundingLinkAvailability = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  MISSING: "missing",
} as const;

export type GoalFundingLinkAvailability =
  (typeof GoalFundingLinkAvailability)[keyof typeof GoalFundingLinkAvailability];

export const GOAL_FUNDING_LINK_AVAILABILITY_VALUES = [
  GoalFundingLinkAvailability.AVAILABLE,
  GoalFundingLinkAvailability.UNAVAILABLE,
  GoalFundingLinkAvailability.MISSING,
] as const;

/** Household jar allocation health across active jars. */
export const AllocationHealthStatus = {
  BALANCED: "balanced",
  UNDER_ALLOCATED: "under_allocated",
  OVER_ALLOCATED: "over_allocated",
  NO_INCOME: "no_income",
} as const;

export type AllocationHealthStatus =
  (typeof AllocationHealthStatus)[keyof typeof AllocationHealthStatus];

export const ALLOCATION_HEALTH_STATUS_VALUES = [
  AllocationHealthStatus.BALANCED,
  AllocationHealthStatus.UNDER_ALLOCATED,
  AllocationHealthStatus.OVER_ALLOCATED,
  AllocationHealthStatus.NO_INCOME,
] as const;

/** Derived envelope budget state for one jar in a period. */
export const JarBudgetState = {
  HEALTHY: "healthy",
  NEAR_LIMIT: "near_limit",
  OVERSPENT: "overspent",
  NO_SPENDING: "no_spending",
  NO_BUDGET: "no_budget",
} as const;

export type JarBudgetState =
  (typeof JarBudgetState)[keyof typeof JarBudgetState];

export const JAR_BUDGET_STATE_VALUES = [
  JarBudgetState.HEALTHY,
  JarBudgetState.NEAR_LIMIT,
  JarBudgetState.OVERSPENT,
  JarBudgetState.NO_SPENDING,
  JarBudgetState.NO_BUDGET,
] as const;

/** Source used to derive qualifying monthly income for jar rules. */
export const QualifyingIncomeSource = {
  CONFIGURED: "configured",
  RECURRING_FALLBACK: "recurring_fallback",
  POSTED_FALLBACK: "posted_fallback",
  NONE: "none",
} as const;

export type QualifyingIncomeSource =
  (typeof QualifyingIncomeSource)[keyof typeof QualifyingIncomeSource];

export const QUALIFYING_INCOME_SOURCE_VALUES = [
  QualifyingIncomeSource.CONFIGURED,
  QualifyingIncomeSource.RECURRING_FALLBACK,
  QualifyingIncomeSource.POSTED_FALLBACK,
  QualifyingIncomeSource.NONE,
] as const;

/** Sentinel period keys for recommendation id generation (not calendar months). */
export const PlanRecommendationPeriodKey = {
  CURRENT: "current",
  LEGACY: "legacy",
} as const;

export type PlanRecommendationPeriodKey =
  (typeof PlanRecommendationPeriodKey)[keyof typeof PlanRecommendationPeriodKey];

export const PLAN_RECOMMENDATION_PERIOD_KEY_VALUES = [
  PlanRecommendationPeriodKey.CURRENT,
  PlanRecommendationPeriodKey.LEGACY,
] as const;

export const RecurringDirection = TransactionDirection;
export type RecurringDirection =
  (typeof RecurringDirection)[keyof typeof RecurringDirection];

export const RECURRING_DIRECTION_OPTIONS = [
  RecurringDirection.EXPENSE,
  RecurringDirection.INCOME,
] as const;

export const RecurringFrequency = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

export type RecurringFrequency =
  (typeof RecurringFrequency)[keyof typeof RecurringFrequency];

export const RECURRING_FREQUENCY_VALUES = [
  RecurringFrequency.WEEKLY,
  RecurringFrequency.MONTHLY,
] as const;

export const RitualStatus = {
  DRAFT: "draft",
  PREVIEWED: "previewed",
  APPROVED: "approved",
  CORRECTED: "corrected",
  /** Spec PendingReview — 30-day temporal auto-lock (BR-08). */
  PENDING_REVIEW: "pending_review",
} as const;

export type RitualStatus = (typeof RitualStatus)[keyof typeof RitualStatus];

export const RITUAL_STATUS_VALUES = [
  RitualStatus.DRAFT,
  RitualStatus.PREVIEWED,
  RitualStatus.APPROVED,
  RitualStatus.CORRECTED,
  RitualStatus.PENDING_REVIEW,
] as const;

/** Plan V2 optional Monthly Review mark — never locks Plan. */
export const MonthlyReviewStatus = {
  NOT_STARTED: "not_started",
  VIEWED: "viewed",
  MARKED_REVIEWED: "marked_reviewed",
} as const;

export type MonthlyReviewStatus =
  (typeof MonthlyReviewStatus)[keyof typeof MonthlyReviewStatus];

export const MONTHLY_REVIEW_STATUS_VALUES = [
  MonthlyReviewStatus.NOT_STARTED,
  MonthlyReviewStatus.VIEWED,
  MonthlyReviewStatus.MARKED_REVIEWED,
] as const;

/**
 * V1 statuses that previously locked plan mutations (BR-08).
 * Plan V2: empty — Monthly Review never locks Plan usage.
 * Kept as a named constant so call sites and tests stay explicit.
 */
export const RITUAL_LOCKED_STATUSES = [] as const;

/** @deprecated Plan V2 — auto-lock no longer runs. Retained for historical helpers. */
export const RITUAL_AUTOLOCK_ELIGIBLE_STATUSES = [
  RitualStatus.DRAFT,
  RitualStatus.PREVIEWED,
  RitualStatus.CORRECTED,
] as const;

/** @deprecated Plan V2 — auto-lock disabled. */
export const RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END = 30;

/** @deprecated Plan V2 — Quick Close deprecated (BR-23). */
export const QUICK_CLOSE_CONSECUTIVE_RITUALS = 6;

/**
 * Household Plan assistance mode (Plan V2).
 * Replaces user-facing month_close_mode auto/quick_close semantics.
 */
export const PlanAssistMode = {
  ASSISTED: "assisted",
  MANUAL: "manual",
} as const;

export type PlanAssistMode =
  (typeof PlanAssistMode)[keyof typeof PlanAssistMode];

export const PLAN_ASSIST_MODE_VALUES = [
  PlanAssistMode.ASSISTED,
  PlanAssistMode.MANUAL,
] as const;

/**
 * Spec "Miscellaneous Jar" fallback for BR-15 month-lock triage.
 * Seeded household name remains `General` (Sprint 1).
 */
export const MISCELLANEOUS_JAR_NAME = "General";

/** Plan movements never touch the Real Ledger (BR-01 / AC-JAR-01). */
export const PLAN_MOVEMENT_LEDGER_IMPACT = 0;

/** Virtual capacity shift direction for plan movements (intention only). */
export const CapacityMovementDirection = {
  OUT: "out",
  IN: "in",
} as const;

export type CapacityMovementDirection =
  (typeof CapacityMovementDirection)[keyof typeof CapacityMovementDirection];

export const CAPACITY_MOVEMENT_DIRECTION_VALUES = [
  CapacityMovementDirection.OUT,
  CapacityMovementDirection.IN,
] as const;

export const PlanMovementEvent = {
  EMERGENCY_DECLARED: "EmergencyDeclaredEvent",
  JAR_REALLOCATED: "JarReallocatedEvent",
} as const;

export type PlanMovementEvent =
  (typeof PlanMovementEvent)[keyof typeof PlanMovementEvent];

export const PLAN_ACTION_ERROR_CODE = {
  EMERGENCY_NOTE_REQUIRED: "emergency_note_required",
  SAME_JAR: "same_jar",
  WARNING_REQUIRED: "warning_required",
  CAPACITY_BLOCKED: "capacity_blocked",
} as const;

export type PlanActionErrorCode =
  (typeof PLAN_ACTION_ERROR_CODE)[keyof typeof PLAN_ACTION_ERROR_CODE];

export const PLAN_OPERATION = {
  CONFIGURE_JAR: "configureJar",
  ENSURE_JAR_PERIOD_SNAPSHOTS: "ensureJarPeriodRuleSnapshots",
  RENAME_JAR: "renameJar",
  REALLOCATE_JAR_CAPACITY: "reallocateJarCapacity",
  SET_JAR_STATE: "setJarState",
  UPSERT_JAR_PLAN: "upsertJarPlan",
  MONTHLY_REVIEW_METADATA: "monthlyReviewMetadata",
  LIST_GOALS: "listGoals",
  LIST_GOAL_FUNDING_OPTIONS: "listGoalFundingOptions",
  LIST_JAR_CATEGORIES: "listJarCategories",
  LIST_RECURRING: "listRecurring",
  GET_RECURRING: "getRecurring",
  LIST_PAYOFF_INBOX_ITEMS: "listPayoffInboxItems",
  GET_MONTH_RITUAL: "getMonthRitual",
} as const;

export type PlanOperation =
  (typeof PLAN_OPERATION)[keyof typeof PLAN_OPERATION];

/**
 * Compatibility markers for the current RPC, which still raises plain text
 * PostgreSQL exceptions instead of structured domain metadata.
 */
export const PLAN_REALLOCATION_LEGACY_ERROR_MARKERS = {
  EMERGENCY_NOTE_REQUIRED: ["intent note"],
  CAPACITY_BLOCKED: [
    "insufficient_reallocatable",
    "capacity",
    "snapshot required",
  ],
  SAME_JAR: ["distinct source", "same"],
} as const;

/** Month Ritual gate failures (ST-E04-002 / BR-23 / REQ-RIT-02). */
export const RITUAL_GATE_ERROR_CODE = {
  RITUAL_DIVERGENCE: "ritual_divergence",
  QUICK_CLOSE_LOCKED: "quick_close_locked",
  EMERGENCIES_UNACKNOWLEDGED: "emergencies_unacknowledged",
} as const;

export type RitualGateErrorCode =
  (typeof RITUAL_GATE_ERROR_CODE)[keyof typeof RITUAL_GATE_ERROR_CODE];

/**
 * Household Financial Calendar event sources (REQ-CAL-01 / BR-17 / BR-20).
 * Lives under Plan as CalendarSchedule — not a separate BC.
 */
export const CalendarEventSource = {
  RECURRING: "recurring",
  CARD_DUE: "card_due",
  LOAN: "loan",
  /** @deprecated Use LOAN. */
  INSTALLMENT: "loan",
  LIABILITY: "liability",
  PAYOFF_MILESTONE: "payoff_milestone",
} as const;

export type CalendarEventSource =
  (typeof CalendarEventSource)[keyof typeof CalendarEventSource];

export const CALENDAR_EVENT_SOURCE_VALUES = [
  CalendarEventSource.RECURRING,
  CalendarEventSource.CARD_DUE,
  CalendarEventSource.LOAN,
  CalendarEventSource.LIABILITY,
  CalendarEventSource.PAYOFF_MILESTONE,
] as const;

export const CalendarCashFlowSign = {
  INFLOW: "inflow",
  OUTFLOW: "outflow",
  NEUTRAL: "neutral",
} as const;

export type CalendarCashFlowSign =
  (typeof CalendarCashFlowSign)[keyof typeof CalendarCashFlowSign];

export const CALENDAR_CASH_FLOW_SIGN_VALUES = [
  CalendarCashFlowSign.INFLOW,
  CalendarCashFlowSign.OUTFLOW,
  CalendarCashFlowSign.NEUTRAL,
] as const;

/** Default projection horizon in months from the anchor month start. */
export const CALENDAR_PROJECTION_MONTHS = 3;

/**
 * Warn when projected real cash (not jar intention) would fall at or below
 * this threshold after scheduled outflows (ST-E05-002 / Spec Sync override of EO-03 R1).
 */
export const CASH_FLOW_DEFICIT_THRESHOLD = 0;
