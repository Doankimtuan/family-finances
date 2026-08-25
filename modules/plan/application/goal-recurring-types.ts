import {
  calculateGoalProgressPercent,
  resolveGoalFundingStatus,
  type GoalFundingSummary,
} from "./goal-funding";
import {
  GoalBackingState,
  GoalFundingQuality,
  GoalFundingValueStatus,
  GoalStatus,
  GoalType,
  RecurringDirection,
  RecurringFrequency,
  type GoalBackingState as GoalBackingStateValue,
  type GoalFundingLinkAvailability as GoalFundingLinkAvailabilityValue,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
  type RecurringDirection as RecurringDirectionValue,
  type RecurringFrequency as RecurringFrequencyValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
} from "./plan-constants";
export {
  GoalFundingSourceKind,
  GoalStatus,
  GoalType,
  RecurringDirection,
  RecurringFrequency,
  GoalBackingState,
  GoalFundingLinkAvailability,
  GOAL_STATUS_VALUES,
  GOAL_TYPE_VALUES,
  GOAL_FUNDING_SOURCE_KIND_VALUES,
  GOAL_FUNDING_LINK_AVAILABILITY_VALUES,
  GOAL_BACKING_STATE_VALUES,
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
  availability?: GoalFundingLinkAvailabilityValue;
};
export type PlanGoal = {
  id: string;
  name: string;
  targetAmount: number;
  fundedAmount: number;
  targetDate: string | null;
  status: GoalStatusValue;
  goalType: GoalTypeValue;
  fundingLinks: GoalFundingLink[];
  backingState: GoalBackingStateValue;
  fundingValueStatus: GoalFundingQuality | typeof GoalBackingState.LEGACY;
  fundingSummary: GoalFundingSummary | null;
  isLegacyIntention: boolean;
  /** May exceed 100% when linked Money value exceeds the target. */
  progressPercent: number | null;
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

function asGoalType(value: string | null | undefined): GoalTypeValue {
  switch (value) {
    case GoalType.INVEST:
      return GoalType.INVEST;
    case GoalType.PAYOFF:
      return GoalType.PAYOFF;
    default:
      return GoalType.SAVE_UP;
  }
}

function resolveGoalBackingState(
  isLegacyIntention: boolean,
  fundingLinkCount: number,
): GoalBackingStateValue {
  if (isLegacyIntention) return GoalBackingState.LEGACY;
  if (fundingLinkCount > 0) return GoalBackingState.LINKED;
  return GoalBackingState.NEEDS_BACKING;
}

function resolveGoalFundedAmount(
  backingState: GoalBackingStateValue,
  legacyAmount: number,
  fundingSummary: GoalFundingSummary | null,
  derivedFundedAmount?: number,
): number {
  switch (backingState) {
    case GoalBackingState.LEGACY:
      return legacyAmount;
    case GoalBackingState.LINKED:
      return fundingSummary?.fundedAmount ?? derivedFundedAmount ?? 0;
    default:
      return 0;
  }
}

function resolveMappedGoalStatus(
  backingState: GoalBackingStateValue,
  storedStatus: GoalStatusValue,
  fundedAmount: number,
  targetAmount: number,
): GoalStatusValue {
  if (backingState !== GoalBackingState.LINKED) return storedStatus;
  return resolveGoalFundingStatus(storedStatus, fundedAmount, targetAmount);
}

function resolveGoalFundingValueStatus(
  backingState: GoalBackingStateValue,
  fundingSummary: GoalFundingSummary | null,
  fundingValueStatus?: GoalFundingQuality,
): PlanGoal["fundingValueStatus"] {
  if (backingState === GoalBackingState.LEGACY) return GoalBackingState.LEGACY;
  return (
    fundingValueStatus ??
    fundingSummary?.valueStatus ??
    GoalFundingQuality.CURRENT
  );
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
  const backingState = resolveGoalBackingState(
    isLegacyIntention,
    fundingLinks.length,
  );
  const fundingSummary = options?.fundingSummary ?? null;
  const fundedAmount = resolveGoalFundedAmount(
    backingState,
    legacyAmount,
    fundingSummary,
    options?.derivedFundedAmount,
  );
  const storedStatus = asGoalStatus(row.status);
  const goalType = asGoalType(row.goal_type);
  const progressPercent =
    fundingSummary?.valueStatus === GoalFundingQuality.INDETERMINATE
      ? null
      : calculateGoalProgressPercent(fundedAmount, targetAmount);
  return {
    id: row.id,
    name: row.name,
    targetAmount,
    fundedAmount,
    targetDate: row.target_date,
    status: resolveMappedGoalStatus(
      backingState,
      storedStatus,
      fundedAmount,
      targetAmount,
    ),
    goalType,
    fundingLinks,
    backingState,
    fundingValueStatus: resolveGoalFundingValueStatus(
      backingState,
      fundingSummary,
      options?.fundingValueStatus,
    ),
    fundingSummary:
      backingState === GoalBackingState.LINKED ? fundingSummary : null,
    isLegacyIntention,
    progressPercent,
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
