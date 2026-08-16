import type { JarBudgetMetrics, JarBudgetState } from "./jar-budget";

export const PlanHomeHealthStatus = {
  HEALTHY: "healthy",
  ATTENTION: "attention",
  OFF_TRACK: "off_track",
  NO_PLAN: "no_plan",
} as const;

export type PlanHomeHealthStatus =
  (typeof PlanHomeHealthStatus)[keyof typeof PlanHomeHealthStatus];

export type PlanHomeException = {
  kind:
    | "overspent_jar"
    | "uncategorized"
    | "no_income"
    | "over_allocated"
    | "near_limit_jar"
    | "goal_backing";
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
  const overspent = input.budgets.filter((b) => b.state === "overspent").length;
  if (overspent > 0) return PlanHomeHealthStatus.OFF_TRACK;
  // Unmapped transactions are important, but they do not mean that the plan
  // itself is off track. They are a classification task for the household.
  if (input.uncategorizedCount > 0) return PlanHomeHealthStatus.ATTENTION;
  const near = input.budgets.filter((b) => b.state === "near_limit").length;
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
    if (metrics.state === "overspent") {
      exceptions.push({
        kind: "overspent_jar",
        jarId: jar.id,
        jarName: jar.name,
        amount: Math.abs(Math.min(metrics.remainingAmount, 0)),
        percent: metrics.usagePercent,
      });
    } else if (metrics.state === "near_limit") {
      exceptions.push({
        kind: "near_limit_jar",
        jarId: jar.id,
        jarName: jar.name,
        amount: metrics.remainingAmount,
        percent: metrics.usagePercent,
      });
    }
  }
  if (input.uncategorizedCount > 0) {
    exceptions.push({
      kind: "uncategorized",
      count: input.uncategorizedCount,
    });
  }
  return exceptions;
}

const EXCEPTION_PRIORITY: Record<PlanHomeException["kind"], number> = {
  overspent_jar: 1,
  uncategorized: 2,
  no_income: 3,
  over_allocated: 4,
  near_limit_jar: 5,
  goal_backing: 6,
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
  state: JarBudgetState | undefined,
): boolean {
  return state === "overspent";
}
