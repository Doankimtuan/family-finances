/**
 * Plan domain constants — jars, goals, recurring, ritual.
 */

import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";

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

export const GoalStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const GOAL_STATUS_VALUES = [
  GoalStatus.ACTIVE,
  GoalStatus.PAUSED,
  GoalStatus.COMPLETED,
  GoalStatus.CANCELLED,
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

export const IncomeAllocateMode = {
  OFF: "off",
  SUGGEST: "suggest",
  AUTO: "auto",
} as const;

export type IncomeAllocateMode =
  (typeof IncomeAllocateMode)[keyof typeof IncomeAllocateMode];

export const INCOME_ALLOCATE_MODE_VALUES = [
  IncomeAllocateMode.OFF,
  IncomeAllocateMode.SUGGEST,
  IncomeAllocateMode.AUTO,
] as const;

export const RitualMode = {
  ASSISTED: "assisted",
  AUTO: "auto",
  MANUAL: "manual",
  QUICK_CLOSE: "quick_close",
} as const;

export type RitualMode = (typeof RitualMode)[keyof typeof RitualMode];

export const RITUAL_MODE_VALUES = [
  RitualMode.ASSISTED,
  RitualMode.AUTO,
  RitualMode.MANUAL,
  RitualMode.QUICK_CLOSE,
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

/** Statuses that lock normal plan mutations (BR-08). */
export const RITUAL_LOCKED_STATUSES = [
  RitualStatus.APPROVED,
  RitualStatus.PENDING_REVIEW,
] as const;

/** Unapproved statuses eligible for temporal auto-lock. */
export const RITUAL_AUTOLOCK_ELIGIBLE_STATUSES = [
  RitualStatus.DRAFT,
  RitualStatus.PREVIEWED,
  RitualStatus.CORRECTED,
] as const;

/** Days after month-end before unapproved rituals auto-lock (BR-08 / AC-RIT-01). */
export const RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END = 30;

/** Consecutive Assisted approvals required before Quick Close (BR-23). */
export const QUICK_CLOSE_CONSECUTIVE_RITUALS = 6;

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
