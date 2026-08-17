import { CycleStatus } from "../savings-constants";
import type { SavingCycle } from "../types/savings.types";

export function selectCurrentSavingCycle(
  cycles: readonly SavingCycle[],
): SavingCycle | null {
  const byNewest = (left: SavingCycle, right: SavingCycle) =>
    right.cycleNumber - left.cycleNumber ||
    right.createdAt.localeCompare(left.createdAt);
  return (
    [...cycles]
      .filter((cycle) => cycle.status === CycleStatus.ACTIVE)
      .sort(byNewest)[0] ??
    [...cycles]
      .filter((cycle) => cycle.status === CycleStatus.MATURED)
      .sort(byNewest)[0] ??
    [...cycles].sort(byNewest)[0] ??
    null
  );
}
