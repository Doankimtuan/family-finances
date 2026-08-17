import { JarPlanKind, type PlanJar } from "./jar-types";
import { AllocationHealthStatus } from "./plan-constants";

export type AllocationHealth = {
  status: AllocationHealthStatus;
  incomeBase: number;
  plannedOutlay: number;
  percentTotalBps: number;
  fixedTotal: number;
  utilizationPercent: number;
};

/**
 * Household allocation health for mixed percent + fixed jars (Plan V2).
 * Warns only — never blocks saves.
 */
export function calculateAllocationHealth(
  jars: readonly Pick<PlanJar, "plan">[],
  incomeBase: number,
): AllocationHealth {
  let percentTotalBps = 0;
  let fixedTotal = 0;
  for (const jar of jars) {
    const plan = jar.plan;
    if (!plan) continue;
    if (plan.kind === JarPlanKind.PERCENT) {
      percentTotalBps += Math.max(0, plan.percentBps);
    } else if (plan.kind === JarPlanKind.FIXED) {
      fixedTotal += Math.max(0, plan.fixedAmount);
    }
  }

  const percentOutlay =
    incomeBase > 0
      ? Math.floor((Math.max(0, incomeBase) * percentTotalBps) / 10_000)
      : 0;
  const plannedOutlay = percentOutlay + fixedTotal;

  if (incomeBase <= 0 && percentTotalBps > 0) {
    return {
      status: AllocationHealthStatus.NO_INCOME,
      incomeBase,
      plannedOutlay: fixedTotal,
      percentTotalBps,
      fixedTotal,
      utilizationPercent: 0,
    };
  }

  if (incomeBase <= 0) {
    return {
      status:
        fixedTotal > 0
          ? AllocationHealthStatus.OVER_ALLOCATED
          : AllocationHealthStatus.BALANCED,
      incomeBase,
      plannedOutlay: fixedTotal,
      percentTotalBps,
      fixedTotal,
      utilizationPercent: 0,
    };
  }

  const utilizationPercent = Math.round((plannedOutlay / incomeBase) * 100);
  const status: AllocationHealthStatus =
    plannedOutlay > incomeBase
      ? AllocationHealthStatus.OVER_ALLOCATED
      : plannedOutlay < incomeBase
        ? AllocationHealthStatus.UNDER_ALLOCATED
        : AllocationHealthStatus.BALANCED;

  return {
    status,
    incomeBase,
    plannedOutlay,
    percentTotalBps,
    fixedTotal,
    utilizationPercent,
  };
}

export { AllocationHealthStatus } from "./plan-constants";
