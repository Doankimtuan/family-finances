/**
 * Client-safe Plan exports — constants and types only.
 * Do not re-export queries/commands (they pull next/headers via the server Supabase client).
 */

export {
  JarKind,
  JarState,
  JarPlanKind,
  JarRolloverMode,
  JAR_KIND_VALUES,
  JAR_STATE_VALUES,
  JAR_PLAN_KIND_VALUES,
  JAR_ROLLOVER_MODE_VALUES,
  type JarPlan,
} from "./jar-types";

export {
  calculateAllocationHealth,
  type AllocationHealth,
  type AllocationHealthStatus,
} from "./allocation-health";

export {
  calculateJarBudgetMetrics,
  calculateJarBudgetAmount,
  calculateJarSpentAmount,
  calculatePeriodIncome,
  calculateQualifyingPostedIncome,
  calculateJarRuleBudget,
  classifyJarEnvelopeEffect,
  resolveQualifyingMonthlyIncome,
  resolveJarBudgetState,
  type JarBudgetMetrics,
  type JarBudgetState,
} from "./jar-budget";

export {
  PLAN_MOVEMENT_LEDGER_IMPACT,
  CapacityMovementDirection,
  CAPACITY_MOVEMENT_DIRECTION_VALUES,
  PlanMovementEvent,
  PLAN_ACTION_ERROR_CODE,
  type PlanActionErrorCode,
  type CapacityMovementDirection as CapacityMovementDirectionValue,
} from "./plan-constants";

export {
  shouldShowOverspendWarning,
  isCapacityMoveBlocked,
  isEmergencyIntentValid,
  isZeroLedgerImpact,
  applyCapacityDelta,
  areBankBalancesUnchanged,
  isPartnerEmergencyAlert,
} from "./plan-movement-policy";

export {
  reallocateJarCapacityInputSchema,
  type ReallocateJarCapacityInput,
} from "./commands/reallocate-jar-capacity.schema";

export {
  jarConfigurationInputSchema,
  jarCategoryIdsSchema,
  type JarConfigurationInput,
} from "./commands/configure-jar.schema";

export type {
  MonthRitual,
  RitualPreview,
  RitualDivergenceItem,
  RitualEmergencyItem,
  RitualActionErrorCode,
} from "./ritual-types";

export { RitualMode, RitualStatus, IncomeAllocateMode } from "./ritual-types";

export {
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END,
  MISCELLANEOUS_JAR_NAME,
  RITUAL_LOCKED_STATUSES,
  CalendarEventSource,
  CALENDAR_EVENT_SOURCE_VALUES,
  CalendarCashFlowSign,
  CALENDAR_CASH_FLOW_SIGN_VALUES,
  CALENDAR_PROJECTION_MONTHS,
  CASH_FLOW_DEFICIT_THRESHOLD,
} from "./plan-constants";

export {
  projectRecurringEvents,
  projectCardDueEvents,
  projectLoanEvents,
  projectInstallmentEvents,
  projectLiabilityEvents,
  buildCashFlowForecast,
  mergeAndSortEvents,
  monthRange,
  payoffMilestoneDates,
  type CalendarEvent,
  type CalendarProjection,
  type CashFlowDayForecast,
} from "./calendar-projection";

export {
  GoalStatus,
  GoalType,
  GoalFundingSourceKind,
  RecurringDirection,
  RecurringFrequency,
  GOAL_STATUS_VALUES,
  GOAL_TYPE_VALUES,
  GOAL_FUNDING_SOURCE_KIND_VALUES,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
} from "./goal-recurring-types";

export {
  calculateGoalProgressPercent,
  resolveGoalFundingStatus,
  goalFundingSourceKey,
  hasExclusiveGoalFundingConflict,
  isPayoffFundingSource,
  type GoalFundingSourceValue,
  type GoalFundingLinkIdentity,
} from "./goal-funding";

export {
  currentPeriodMonth,
  formatPeriodLabel,
  periodMonthEndDate,
  isRitualAutolockDue,
  isQuickCloseEligible,
} from "./ritual-period";
