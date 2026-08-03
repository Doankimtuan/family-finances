import {
  GoalStatus,
  RecurringDirection,
  RecurringFrequency,
  type GoalStatus as GoalStatusValue,
  type RecurringDirection as RecurringDirectionValue,
  type RecurringFrequency as RecurringFrequencyValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
} from "./plan-constants";

export {
  GoalStatus,
  RecurringDirection,
  RecurringFrequency,
  GOAL_STATUS_VALUES,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
  IncomeAllocateMode,
} from "./plan-constants";

export type PlanGoal = {
  id: string;
  name: string;
  targetAmount: number;
  fundedAmount: number;
  targetDate: string | null;
  status: GoalStatusValue;
  /** 0–100 progress toward intention target — not a bank balance (BR-01). */
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
    case GoalStatus.COMPLETED:
    case GoalStatus.CANCELLED:
      return value;
    default:
      return GoalStatus.ACTIVE;
  }
}

export function mapGoalRow(row: {
  id: string;
  name: string;
  target_amount: number | string;
  funded_amount: number | string;
  target_date: string | null;
  status: string;
}): PlanGoal {
  const targetAmount = Number(row.target_amount) || 0;
  const fundedAmount = Number(row.funded_amount) || 0;
  const progressPercent =
    targetAmount > 0
      ? Math.min(100, Math.round((fundedAmount / targetAmount) * 100))
      : 0;
  return {
    id: row.id,
    name: row.name,
    targetAmount,
    fundedAmount,
    targetDate: row.target_date,
    status: asGoalStatus(row.status),
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
