import {
  currentPeriodMonth,
  periodMonthEndDate,
} from "./ritual-period";
import { JarRolloverMode, type PlanJar } from "./jar-types";
import {
  calculateJarBudgetAmount,
  calculateJarSpentAmount,
  calculatePeriodIncome,
  type JarBudgetTransaction,
} from "./jar-budget";

/** Previous calendar month start (YYYY-MM-01) for the given period month. */
export function previousPeriodMonth(periodMonth: string): string {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const prev = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1),
  );
  const y = prev.getUTCFullYear();
  const m = String(prev.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function periodBoundsForMonth(periodMonth: string): {
  start: string;
  end: string;
} {
  return {
    start: periodMonth,
    end: periodMonthEndDate(periodMonth),
  };
}

/**
 * Unused budget from the previous period for carry jars.
 * Negative remaining does not carry (Plan V2 default).
 */
export function calculateRolloverCredit(
  jar: Pick<PlanJar, "plan" | "rolloverMode">,
  jarId: string,
  previousTransactions: readonly JarBudgetTransaction[],
  previousAdjustment = 0,
): number {
  if (jar.rolloverMode !== JarRolloverMode.CARRY) return 0;
  const previousIncome = calculatePeriodIncome(previousTransactions);
  const previousBudget = calculateJarBudgetAmount(jar, previousIncome, {
    adjustment: previousAdjustment,
    rolloverCredit: 0,
  });
  const previousSpent = calculateJarSpentAmount(jarId, previousTransactions);
  return Math.max(0, previousBudget - previousSpent);
}

export function sumPeriodAdjustments(
  amounts: readonly (number | string | null | undefined)[],
): number {
  return amounts.reduce<number>(
    (total, amount) => total + (Number(amount) || 0),
    0,
  );
}

export { currentPeriodMonth };

/**
 * Stable rollover from the previous period state. The caller supplies the
 * snapshot-derived effective budget, so later rule edits cannot rewrite it.
 */
export function calculateRolloverCreditFromPreviousState(input: {
  rolloverMode: JarRolloverMode | string;
  previousBudget: number;
  previousSpent: number;
}): number {
  if (input.rolloverMode !== JarRolloverMode.CARRY) return 0;
  return Math.max(0, Math.trunc(input.previousBudget) - Math.trunc(input.previousSpent));
}
