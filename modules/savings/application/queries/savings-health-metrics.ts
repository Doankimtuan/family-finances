import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";
import { SavingStatus, CycleStatus } from "../savings-constants";
import { listSavings } from "./list-savings";

/**
 * BR-24 Health Read-Only — aggregate metrics for Health surfaces.
 * Never mutates savings.
 */
export type SavingsHealthMetrics = {
  activeCount: number;
  maturedPendingCount: number;
  totalPrincipalAllocated: number;
  averageYieldRate: number | null;
  maturityDistribution: Array<{
    bucket: "within_7" | "within_30" | "within_90" | "later";
    count: number;
  }>;
  earlyClosedCount: number;
  renewalCycleCount: number;
};

export async function getSavingsHealthMetrics(): Promise<SavingsHealthMetrics | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  const savings = await listSavings();
  if (!savings) return null;

  const today = todayIsoDate();

  let totalPrincipal = 0;
  let rateSum = 0;
  let rateCount = 0;
  let maturedPending = 0;
  let earlyClosed = 0;
  let renewalCycles = 0;
  const buckets = {
    within_7: 0,
    within_30: 0,
    within_90: 0,
    later: 0,
  };

  for (const saving of savings) {
    if (saving.status === SavingStatus.EARLY_CLOSED) {
      earlyClosed += 1;
    }
    if (saving.status === SavingStatus.MATURED) {
      maturedPending += 1;
    }

    const cycle = saving.latestCycle;
    if (!cycle) continue;

    if (
      cycle.status === CycleStatus.ACTIVE ||
      cycle.status === CycleStatus.MATURED
    ) {
      totalPrincipal += cycle.principal;
      rateSum += cycle.lockedRate;
      rateCount += 1;
    }

    if (cycle.cycleNumber > 1) {
      renewalCycles += 1;
    }

    if (cycle.status === CycleStatus.ACTIVE) {
      const days = differenceInUtcCalendarDays(today, cycle.endDate);
      if (days <= 7) buckets.within_7 += 1;
      else if (days <= 30) buckets.within_30 += 1;
      else if (days <= 90) buckets.within_90 += 1;
      else buckets.later += 1;
    }
  }

  return {
    activeCount: savings.filter((s) => s.status === SavingStatus.ACTIVE).length,
    maturedPendingCount: maturedPending,
    totalPrincipalAllocated: totalPrincipal,
    averageYieldRate: rateCount > 0 ? rateSum / rateCount : null,
    maturityDistribution: [
      { bucket: "within_7", count: buckets.within_7 },
      { bucket: "within_30", count: buckets.within_30 },
      { bucket: "within_90", count: buckets.within_90 },
      { bucket: "later", count: buckets.later },
    ],
    earlyClosedCount: earlyClosed,
    renewalCycleCount: renewalCycles,
  };
}
