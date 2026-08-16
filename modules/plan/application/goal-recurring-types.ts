import {
  GoalStatus,
  GoalType,
  RecurringDirection,
  RecurringFrequency,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
  type RecurringDirection as RecurringDirectionValue,
  type RecurringFrequency as RecurringFrequencyValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
} from "./plan-constants";
import {
  calculateGoalProgressPercent,
  resolveGoalFundingStatus,
  type GoalFundingQuality,
  type GoalFundingSummary,
  type GoalFundingValueStatus,
} from "./goal-funding";
export {
  GoalFundingSourceKind,
  GoalStatus,
  GoalType,
  RecurringDirection,
  RecurringFrequency,
  GOAL_STATUS_VALUES,
  GOAL_TYPE_VALUES,
  GOAL_FUNDING_SOURCE_KIND_VALUES,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
  IncomeAllocateMode,
} from "./plan-constants";
export type GoalFundingLink = {
  id: string;
  kind: GoalFundingSourceKindValue;
  sourceId: string;
  sourceName: string;
  currentAmount: number;
  currency?: string | null;
  valueStatus?: GoalFundingValueStatus;
  availability?: "available" | "unavailable" | "missing";
};
export type GoalBackingState = "linked" | "legacy" | "needs_backing";
export type PlanGoal = {
  id: string;
  name: string;
  targetAmount: number;
  fundedAmount: number;
  targetDate: string | null;
  status: GoalStatusValue;
  goalType: GoalTypeValue;
  fundingLinks: GoalFundingLink[];
  backingState: GoalBackingState;
  fundingValueStatus: GoalFundingQuality | "legacy";
  fundingSummary: GoalFundingSummary | null;
  isLegacyIntention: boolean;
  /** May exceed 100% when linked Money value exceeds the target. */
  progressPercent: number;
};
export type GoalDetail = PlanGoal & {
  householdId: string;
  currency: string;
};
export type PlanRecurring = {
  id: string;
  name: string;
  direction: RecurringDirectionValue;
  amount: number;
  frequency: RecurringFrequencyValue;
  intervalCount: number;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  nextRunDate: string | null;
  isActive: boolean;
};
export type RecurringDetail = PlanRecurring & {
  householdId: string;
  currency: string;
  incomeAllocateMode: IncomeAllocateModeValue;
};
export type GoalsList = {
  householdId: string;
  currency: string;
  goals: PlanGoal[];
};
export type RecurringList = {
  householdId: string;
  currency: string;
  incomeAllocateMode: IncomeAllocateModeValue;
  rules: PlanRecurring[];
};
function asGoalStatus(value: string): GoalStatusValue {
  switch (value) {
    case GoalStatus.PAUSED:
    case GoalStatus.READY:
    case GoalStatus.COMPLETED:
    case GoalStatus.CANCELLED:
      return value;
    default:
      return GoalStatus.ACTIVE;
  }
}
export function mapGoalRow(
  row: {
    id: string;
    name: string;
    target_amount: number | string;
    funded_amount: number | string;
    legacy_funded_amount?: number | string | null;
    target_date: string | null;
    status: string;
    goal_type?: string | null;
  },
  options?: {
    fundingLinks?: GoalFundingLink[];
    derivedFundedAmount?: number;
    fundingSummary?: GoalFundingSummary;
    fundingValueStatus?: GoalFundingQuality;
  },
): PlanGoal {
  const targetAmount = Number(row.target_amount) || 0;
  const fundingLinks = options?.fundingLinks ?? [];
  const legacyAmount =
    row.legacy_funded_amount == null
      ? Number(row.funded_amount) || 0
      : Number(row.legacy_funded_amount) || 0;
  const hasLegacyColumn = Object.prototype.hasOwnProperty.call(
    row,
    "legacy_funded_amount",
  );
  const isLegacyIntention =
    fundingLinks.length === 0 &&
    (!hasLegacyColumn || row.legacy_funded_amount != null);
  const backingState: GoalBackingState = isLegacyIntention
    ? "legacy"
    : fundingLinks.length > 0
      ? "linked"
      : "needs_backing";
  const fundingSummary = options?.fundingSummary ?? null;
  const fundedAmount =
    backingState === "legacy"
      ? legacyAmount
      : backingState === "linked"
        ? (fundingSummary?.fundedAmount ?? options?.derivedFundedAmount ?? 0)
        : 0;
  const storedStatus = asGoalStatus(row.status);
  const goalType =
    row.goal_type === GoalType.INVEST
      ? GoalType.INVEST
      : row.goal_type === GoalType.PAYOFF
        ? GoalType.PAYOFF
        : GoalType.SAVE_UP;
  return {
    id: row.id,
    name: row.name,
    targetAmount,
    fundedAmount,
    targetDate: row.target_date,
    status:
      backingState === "linked"
        ? resolveGoalFundingStatus(storedStatus, fundedAmount, targetAmount)
        : storedStatus,
    goalType,
    fundingLinks,
    backingState,
    fundingValueStatus:
      backingState === "legacy"
        ? "legacy"
        : (options?.fundingValueStatus ??
          fundingSummary?.valueStatus ??
          "current"),
    fundingSummary: backingState === "linked" ? fundingSummary : null,
    isLegacyIntention,
    progressPercent: calculateGoalProgressPercent(fundedAmount, targetAmount),
  };
}
export function mapRecurringRow(row: {
  id: string;
  name: string;
  direction: string;
  amount: number | string;
  frequency: string;
  interval_count: number;
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  next_run_date: string | null;
  is_active: boolean;
}): PlanRecurring {
  return {
    id: row.id,
    name: row.name,
    direction:
      row.direction === RecurringDirection.INCOME
        ? RecurringDirection.INCOME
        : RecurringDirection.EXPENSE,
    amount: Number(row.amount) || 0,
    frequency:
      row.frequency === RecurringFrequency.WEEKLY
        ? RecurringFrequency.WEEKLY
        : RecurringFrequency.MONTHLY,
    intervalCount: row.interval_count || 1,
    dayOfMonth: row.day_of_month,
    dayOfWeek: row.day_of_week,
    startDate: row.start_date,
    nextRunDate: row.next_run_date,
    isActive: Boolean(row.is_active),
  };
}
