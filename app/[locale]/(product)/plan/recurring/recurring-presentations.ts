import type { PlanRecurring } from "@/modules/plan/application/goal-recurring-types";
import { RecurringFrequency } from "@/modules/plan/application/plan-constants";
import {
  WEEKDAY_KEYS_BY_UTC_DAY,
  type WeekdayKey,
} from "@/shared/i18n/week-start";

export function isActiveRecurring(rule: PlanRecurring) {
  return rule.isActive;
}

export function partitionRecurringRules(rules: readonly PlanRecurring[]): {
  active: PlanRecurring[];
  paused: PlanRecurring[];
} {
  const active: PlanRecurring[] = [];
  const paused: PlanRecurring[] = [];
  for (const rule of rules) {
    if (isActiveRecurring(rule)) active.push(rule);
    else paused.push(rule);
  }
  return {
    active: sortRecurringByNextRun(active),
    paused: sortRecurringByNextRun(paused),
  };
}

export function sortRecurringByNextRun(
  rules: readonly PlanRecurring[],
): PlanRecurring[] {
  return rules.toSorted((left, right) => {
    const leftDate = left.nextRunDate ?? "9999-12-31";
    const rightDate = right.nextRunDate ?? "9999-12-31";
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return left.name.localeCompare(right.name);
  });
}

export function weekdayKeyForUtcDay(dayOfWeek: number): WeekdayKey | null {
  return WEEKDAY_KEYS_BY_UTC_DAY[dayOfWeek] ?? null;
}

export function isWeeklyRecurring(
  frequency: PlanRecurring["frequency"],
): boolean {
  return frequency === RecurringFrequency.WEEKLY;
}
