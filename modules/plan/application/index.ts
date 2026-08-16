import "server-only";

export { getPlanPulse, listActiveJars } from "./queries/get-plan-pulse";
export {
  getCurrentJarBudgets,
  getJarBudgetsForPeriod,
  jarBudgetPeriodBounds,
  type CurrentJarBudgetSummary,
  type JarBudgetPeriod,
} from "./queries/get-current-jar-budgets";
export {
  calculateAllocationHealth,
  type AllocationHealth,
  type AllocationHealthStatus,
} from "./allocation-health";
export {
  calculateJarBudgetMetrics,
  type JarBudgetMetrics,
  type JarBudgetState,
} from "./jar-budget";
export {
  buildAssistedSuggestions,
  PlanAssistedSuggestionKind,
  type PlanAssistedSuggestion,
} from "./assisted-suggestions";
export {
  getPlanRecommendations,
  PlanRecommendationType,
  type PlanRecommendation,
  type PlanRecommendationAction,
  type PlanRecommendationInput,
  type RecurringMismatchInput,
} from "./plan-recommendations";
export { ensureJarPeriodRuleSnapshots } from "./commands/ensure-jar-period-snapshots";
export {
  resolvePlanHomeHealth,
  collectPlanHomeExceptions,
  prioritizePlanHomeExceptions,
  PlanHomeHealthStatus,
} from "./plan-home-health";
export { listJars, getJar } from "./queries/list-jars";
export {
  listJarCategories,
  type JarCategoryOption,
} from "./queries/list-jar-categories";
export { listGoals, getGoal } from "./queries/list-goals";
export {
  listGoalFundingOptions,
  type GoalFundingOption,
} from "./queries/list-goal-funding-options";
export { listRecurring, getRecurring } from "./queries/list-recurring";
export { getMonthRitual, buildRitualPreview } from "./queries/get-month-ritual";
export { getHouseholdCalendar } from "./queries/get-household-calendar";
export {
  listRitualDivergence,
  listRitualEmergencies,
} from "./queries/ritual-gates";
export {
  setJarState,
  setJarStateInputSchema,
  type SetJarStateInput,
  type SetJarStateResult,
} from "./commands/set-jar-state";
export {
  upsertJarPlan,
  upsertJarPlanInputSchema,
  type UpsertJarPlanInput,
  type UpsertJarPlanResult,
} from "./commands/upsert-jar-plan";
export {
  createJar,
  createJarInputSchema,
  type CreateJarInput,
  type CreateJarResult,
} from "./commands/create-jar";
export {
  updateJarConfiguration,
  jarConfigurationInputSchema,
  type JarConfigurationInput,
  type ConfigureJarResult,
} from "./commands/configure-jar";
export {
  renameJar,
  renameJarInputSchema,
  type RenameJarInput,
  type RenameJarResult,
} from "./commands/rename-jar";
export {
  reallocateJarCapacity,
  type ReallocateJarCapacityResult,
  type ReallocateJarCapacityErrorCode,
} from "./commands/reallocate-jar-capacity";
export {
  reallocateJarCapacityInputSchema,
  type ReallocateJarCapacityInput,
} from "./commands/reallocate-jar-capacity.schema";
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
  PLAN_MOVEMENT_LEDGER_IMPACT,
  CapacityMovementDirection,
  CAPACITY_MOVEMENT_DIRECTION_VALUES,
  PlanMovementEvent,
  PLAN_ACTION_ERROR_CODE,
  type PlanActionErrorCode,
  type CapacityMovementDirection as CapacityMovementDirectionValue,
} from "./plan-constants";
export {
  createGoal,
  createGoalInputSchema,
  contributeToGoal,
  contributeToGoalInputSchema,
  updateGoal,
  updateGoalInputSchema,
  type CreateGoalInput,
  type CreateGoalResult,
  type ContributeToGoalInput,
  type ContributeToGoalResult,
  type UpdateGoalInput,
  type UpdateGoalResult,
} from "./commands/upsert-goal";
export {
  linkGoalFunding,
  unlinkGoalFunding,
  linkGoalFundingInputSchema,
  unlinkGoalFundingInputSchema,
  type LinkGoalFundingInput,
  type UnlinkGoalFundingInput,
  type GoalFundingMutationResult,
} from "./commands/link-goal-funding";
export {
  createRecurring,
  createRecurringInputSchema,
  updateRecurring,
  updateRecurringInputSchema,
  deleteRecurring,
  deleteRecurringInputSchema,
  type CreateRecurringInput,
  type CreateRecurringResult,
  type UpdateRecurringInput,
  type UpdateRecurringResult,
  type DeleteRecurringInput,
  type DeleteRecurringResult,
} from "./commands/upsert-recurring";
export {
  previewMonthRitual,
  approveMonthRitual,
  correctMonthRitual,
  acknowledgeRitualEmergencies,
  correctMonthRitualInputSchema,
  type CorrectMonthRitualInput,
  type ApproveMonthRitualOptions,
  type RitualMutationResult,
} from "./commands/month-ritual";
export { runMonthRitualAutolockWorker } from "./commands/run-month-ritual-autolock";
export { assertPlanPeriodUnlocked } from "./assert-plan-unlocked";
export {
  currentPeriodMonth,
  formatPeriodLabel,
  periodMonthEndDate,
  periodMonthExclusiveEnd,
  isRitualAutolockDue,
  isQuickCloseEligible,
} from "./ritual-period";
export type {
  PlanJar,
  PlanPulse,
  JarPlan,
  JarList,
  JarDetail,
} from "./jar-types";
export {
  mapJarRow,
  mapJarPlan,
  resolveJarState,
  isAllocationTarget,
  mapIncomeAllocateMode,
  mapMonthCloseMode,
  JarKind,
  JarState,
  JarPlanKind,
  JAR_KIND_VALUES,
  JAR_STATE_VALUES,
  JAR_PLAN_KIND_VALUES,
} from "./jar-types";
export type {
  PlanGoal,
  GoalDetail,
  GoalFundingLink,
  GoalsList,
  PlanRecurring,
  RecurringDetail,
  RecurringList,
} from "./goal-recurring-types";
export {
  mapGoalRow,
  mapRecurringRow,
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
  deriveGoalFundedAmount,
  calculateGoalProgressPercent,
  resolveGoalFundingStatus,
  goalFundingSourceKey,
  hasExclusiveGoalFundingConflict,
  isPayoffFundingSource,
  type GoalFundingSourceValue,
  type GoalFundingLinkIdentity,
} from "./goal-funding";
export type {
  MonthRitual,
  RitualPreview,
  RitualDivergenceItem,
  RitualEmergencyItem,
  RitualActionErrorCode,
} from "./ritual-types";
export {
  mapRitualMode,
  mapRitualStatus,
  isRitualLockedStatus,
  resolveQuickCloseEligible,
  RitualMode,
  RitualStatus,
  IncomeAllocateMode,
} from "./ritual-types";
export {
  INCOME_ALLOCATE_MODE_VALUES,
  RITUAL_MODE_VALUES,
  RITUAL_STATUS_VALUES,
  RITUAL_LOCKED_STATUSES,
  RITUAL_AUTOLOCK_ELIGIBLE_STATUSES,
  RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END,
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  MISCELLANEOUS_JAR_NAME,
  GOAL_FUNDING_LINKABLE_STATUS_VALUES,
  PlanAssistMode,
  PLAN_ASSIST_MODE_VALUES,
  MonthlyReviewStatus,
  MONTHLY_REVIEW_STATUS_VALUES,
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
export type { HouseholdCalendar } from "./queries/get-household-calendar";
export { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";

export { reallocateJarBudget } from "./commands/reallocate-jar-capacity";
export {
  getMonthlyReview,
  type MonthlyReview,
} from "./queries/get-monthly-review";
