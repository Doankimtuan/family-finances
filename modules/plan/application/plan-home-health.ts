import {
  JarBudgetState,
  type JarBudgetState as JarBudgetStateValue,
} from "./plan-constants";
import type { JarBudgetMetrics } from "./jar-budget";

export const PlanHomeHealthStatus = {
  HEALTHY: "healthy",
  ATTENTION: "attention",
  OFF_TRACK: "off_track",
  NO_PLAN: "no_plan",
} as const;

export type PlanHomeHealthStatus =
  (typeof PlanHomeHealthStatus)[keyof typeof PlanHomeHealthStatus];

export const PlanHomeExceptionKind = {
  OVERSPENT_JAR: "overspent_jar",
  UNCATEGORIZED: "uncategorized",
  NO_INCOME: "no_income",
  OVER_ALLOCATED: "over_allocated",
  NEAR_LIMIT_JAR: "near_limit_jar",
  GOAL_BACKING: "goal_backing",
} as const;

export type PlanHomeExceptionKind =
  (typeof PlanHomeExceptionKind)[keyof typeof PlanHomeExceptionKind];

export type PlanHomeException = {
  kind: PlanHomeExceptionKind;
  jarId?: string;
  jarName?: string;
  count?: number;
  amount?: number;
  percent?: number;
  goalId?: string;
  goalName?: string;
};

export function resolvePlanHomeHealth(input: {
  activeJarCount: number;
  budgets: readonly JarBudgetMetrics[];
  uncategorizedCount: number;
}): PlanHomeHealthStatus {
  if (input.activeJarCount <= 0) return PlanHomeHealthStatus.NO_PLAN;
  const overspent = input.budgets.filter(
    (b) => b.state === JarBudgetState.OVERSPENT,
  ).length;
  if (overspent > 0) return PlanHomeHealthStatus.OFF_TRACK;
  // Unmapped transactions are important, but they do not mean that the plan
  // itself is off track. They are a classification task for the household.
  if (input.uncategorizedCount > 0) return PlanHomeHealthStatus.ATTENTION;
  const near = input.budgets.filter(
    (b) => b.state === JarBudgetState.NEAR_LIMIT,
  ).length;
  if (near > 0) return PlanHomeHealthStatus.ATTENTION;
  return PlanHomeHealthStatus.HEALTHY;
}

export function collectPlanHomeExceptions(input: {
  budgetsByJar: Record<string, JarBudgetMetrics>;
  jars: readonly { id: string; name: string }[];
  uncategorizedCount: number;
}): PlanHomeException[] {
  const exceptions: PlanHomeException[] = [];
  for (const jar of input.jars) {
    const metrics = input.budgetsByJar[jar.id];
    if (!metrics) continue;
    if (metrics.state === JarBudgetState.OVERSPENT) {
      exceptions.push({
        kind: PlanHomeExceptionKind.OVERSPENT_JAR,
        jarId: jar.id,
        jarName: jar.name,
        amount: Math.abs(Math.min(metrics.remainingAmount, 0)),
        percent: metrics.usagePercent,
      });
    } else if (metrics.state === JarBudgetState.NEAR_LIMIT) {
      exceptions.push({
        kind: PlanHomeExceptionKind.NEAR_LIMIT_JAR,
        jarId: jar.id,
        jarName: jar.name,
        amount: metrics.remainingAmount,
        percent: metrics.usagePercent,
      });
    }
  }
  if (input.uncategorizedCount > 0) {
    exceptions.push({
      kind: PlanHomeExceptionKind.UNCATEGORIZED,
      count: input.uncategorizedCount,
    });
  }
  return exceptions;
}

const EXCEPTION_PRIORITY: Record<PlanHomeExceptionKind, number> = {
  [PlanHomeExceptionKind.OVERSPENT_JAR]: 1,
  [PlanHomeExceptionKind.UNCATEGORIZED]: 2,
  [PlanHomeExceptionKind.NO_INCOME]: 3,
  [PlanHomeExceptionKind.OVER_ALLOCATED]: 4,
  [PlanHomeExceptionKind.NEAR_LIMIT_JAR]: 5,
  [PlanHomeExceptionKind.GOAL_BACKING]: 6,
};

export function prioritizePlanHomeExceptions(
  exceptions: readonly PlanHomeException[],
  limit = 3,
): PlanHomeException[] {
  return [...exceptions]
    .sort((a, b) => EXCEPTION_PRIORITY[a.kind] - EXCEPTION_PRIORITY[b.kind])
    .slice(0, limit);
}

export function isBudgetStateOverspent(
  state: JarBudgetStateValue | undefined,
): boolean {
  return state === JarBudgetState.OVERSPENT;
}
