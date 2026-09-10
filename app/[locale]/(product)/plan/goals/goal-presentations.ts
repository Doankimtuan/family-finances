import {
  GoalStatus,
  GoalType,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
} from "@/modules/plan/application/plan-constants";
import type { GoalFundingLink } from "@/modules/plan/application/goal-recurring-types";
import { IconContainerTone } from "@/shared/ui/icon-container";

const OPEN_GOAL_STATUSES = new Set<GoalStatusValue>([
  GoalStatus.ACTIVE,
  GoalStatus.PAUSED,
  GoalStatus.READY,
]);

export const GOAL_TYPE_ICON_TONE: Record<GoalTypeValue, IconContainerTone> = {
  [GoalType.SAVE_UP]: IconContainerTone.SAVINGS,
  [GoalType.INVEST]: IconContainerTone.INVESTMENT,
  [GoalType.PAYOFF]: IconContainerTone.DEBT,
};

export function isOpenGoal(status: GoalStatusValue) {
  return OPEN_GOAL_STATUSES.has(status);
}

export function primaryFundingSourceName(
  links: readonly GoalFundingLink[],
): string | null {
  return links[0]?.sourceName ?? null;
}
