import type { JarBudgetMetrics } from "./jar-budget";
import {
  GoalBackingState,
  GoalFundingQuality,
  GoalStatus,
  GoalType,
  JarKind,
  JarRolloverMode,
  JarState,
  PlanAssistMode,
  PlanRecommendationPeriodKey,
} from "./plan-constants";
import {
  getPlanRecommendations,
  PlanRecommendationType,
} from "./plan-recommendations";

export const PlanAssistedSuggestionKind = {
  COVER_OVERSPEND: "cover_overspend",
  UNCATEGORIZED: "uncategorized",
  GOAL_MISSING_BACKING: "goal_missing_backing",
  ALLOCATION_OVER: "allocation_over",
} as const;
export type PlanAssistedSuggestionKind =
  (typeof PlanAssistedSuggestionKind)[keyof typeof PlanAssistedSuggestionKind];
export type PlanAssistedSuggestion = {
  kind: PlanAssistedSuggestionKind;
  jarId?: string;
  jarName?: string;
  sourceJarId?: string;
  sourceJarName?: string;
  amount?: number;
  count?: number;
  goalId?: string;
  goalName?: string;
};

/** Compatibility adapter; recommendation logic lives in plan-recommendations.ts. */
export function buildAssistedSuggestions(input: {
  assistMode: string;
  budgetsByJar: Record<string, JarBudgetMetrics>;
  jars: readonly { id: string; name: string }[];
  uncategorizedCount: number;
  goalsMissingBacking?: readonly { id: string; name: string }[];
  allocationOverPercent?: number;
}): PlanAssistedSuggestion[] {
  if (input.assistMode === PlanAssistMode.MANUAL) return [];
  const jars = input.jars.map((jar) => ({
    ...jar,
    kind: JarKind.SPENDING,
    state: JarState.ACTIVE,
    sortOrder: 0,
    capacityDelta: 0,
    rolloverMode: JarRolloverMode.RESET,
    plan: null,
  }));
  const recommendations = getPlanRecommendations({
    assistMode: input.assistMode,
    periodMonth: PlanRecommendationPeriodKey.LEGACY,
    jars,
    budgetsByJar: input.budgetsByJar,
    uncategorizedCount: input.uncategorizedCount,
    goals: (input.goalsMissingBacking ?? []).map((goal) => ({
      ...goal,
      targetAmount: 0,
      fundedAmount: 0,
      targetDate: null,
      status: GoalStatus.ACTIVE,
      goalType: GoalType.SAVE_UP,
      fundingLinks: [],
      backingState: GoalBackingState.NEEDS_BACKING,
      fundingValueStatus: GoalFundingQuality.CURRENT,
      fundingSummary: null,
      isLegacyIntention: false,
      progressPercent: 0,
    })),
    limit: 5,
  });
  const byId = new Map(input.jars.map((jar) => [jar.id, jar.name]));
  const output = recommendations.flatMap<PlanAssistedSuggestion>(
    (recommendation) => {
      if (recommendation.type === PlanRecommendationType.JAR_OVERSPENT) {
        const donorId =
          typeof recommendation.reason.donorJarId === "string"
            ? recommendation.reason.donorJarId
            : undefined;
        return [
          {
            kind: PlanAssistedSuggestionKind.COVER_OVERSPEND,
            jarId: recommendation.entityId,
            jarName: byId.get(recommendation.entityId ?? ""),
            sourceJarId: donorId,
            sourceJarName: donorId ? byId.get(donorId) : undefined,
            amount: recommendation.amount,
          },
        ];
      }
      if (
        recommendation.type ===
        PlanRecommendationType.UNCATEGORIZED_TRANSACTIONS
      )
        return [
          {
            kind: PlanAssistedSuggestionKind.UNCATEGORIZED,
            count: input.uncategorizedCount,
          },
        ];
      if (recommendation.type === PlanRecommendationType.GOAL_MISSING_BACKING) {
        const goal = input.goalsMissingBacking?.find(
          (item) => item.id === recommendation.entityId,
        );
        return [
          {
            kind: PlanAssistedSuggestionKind.GOAL_MISSING_BACKING,
            goalId: goal?.id,
            goalName: goal?.name,
          },
        ];
      }
      return [];
    },
  );
  if ((input.allocationOverPercent ?? 0) > 100)
    output.push({
      kind: PlanAssistedSuggestionKind.ALLOCATION_OVER,
      count: input.allocationOverPercent,
    });
  return output.slice(0, 5);
}
