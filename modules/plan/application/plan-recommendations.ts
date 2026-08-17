import { calculateAllocationHealth } from "./allocation-health";
import {
  AllocationHealthStatus,
  GoalBackingState,
  GoalFundingLinkAvailability,
  GoalFundingQuality,
  GoalStatus,
  GoalType,
  JarBudgetState,
  JarKind,
  JarRolloverMode,
  JarState,
  PlanAssistMode,
  PlanRecommendationPeriodKey,
} from "./plan-constants";
import type { JarBudgetMetrics } from "./jar-budget";
import type { PlanGoal } from "./goal-recurring-types";
import type { PlanJar } from "./jar-types";
import { differenceInUtcCalendarDays } from "@/shared/utils/iso-date";

export const PlanRecommendationType = {
  JAR_OVERSPENT: "jar_overspent",
  JAR_NEAR_LIMIT: "jar_near_limit",
  PLAN_OVER_ALLOCATED: "plan_over_allocated",
  MISSING_QUALIFYING_INCOME: "missing_qualifying_income",
  UNCATEGORIZED_TRANSACTIONS: "uncategorized_transactions",
  GOAL_MISSING_BACKING: "goal_missing_backing",
  GOAL_SOURCE_UNAVAILABLE: "goal_source_unavailable",
  GOAL_VALUATION_MISSING: "goal_valuation_missing",
  GOAL_READY_REGRESSION: "goal_ready_regression",
  GOAL_TARGET_DATE_RISK: "goal_target_date_risk",
  GOAL_VALUATION_STALE: "goal_valuation_stale",
  RECURRING_AMOUNT_MISMATCH: "recurring_amount_mismatch",
} as const;
export type PlanRecommendationType =
  (typeof PlanRecommendationType)[keyof typeof PlanRecommendationType];

export const PlanRecommendationPriority = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type PlanRecommendationPriority =
  (typeof PlanRecommendationPriority)[keyof typeof PlanRecommendationPriority];

export type PlanRecommendationAction = {
  type:
    | "reallocate_jar_budget"
    | "review_jar_budget"
    | "review_jar_rule"
    | "review_transactions"
    | "plan_settings"
    | "goal_funding_sources"
    | "goal_detail"
    | "investment_detail"
    | "recurring_detail";
  href?: string;
  entityType?: "jar" | "goal" | "transaction" | "recurring" | "plan";
  entityId?: string;
  payload?: Record<string, string | number | boolean>;
};

export type PlanRecommendation = {
  id: string;
  type: PlanRecommendationType;
  priority: PlanRecommendationPriority;
  titleKey: string;
  descriptionKey: string;
  reasonCode: string;
  reason: Record<string, string | number | boolean | null>;
  amount?: number;
  entityType?: "jar" | "goal" | "transaction" | "recurring" | "plan";
  entityId?: string;
  action?: PlanRecommendationAction;
};

export type RecurringMismatchInput = {
  id: string;
  name: string;
  expectedAmount: number;
  actualAmount: number;
};

export type PlanRecommendationInput = {
  assistMode: string;
  periodMonth: string;
  asOfDate?: string;
  isHistorical?: boolean;
  jars: readonly PlanJar[];
  budgetsByJar: Readonly<Record<string, JarBudgetMetrics>>;
  qualifyingIncome?: number;
  uncategorizedCount?: number;
  goals?: readonly PlanGoal[];
  previousReadyGoalIds?: ReadonlySet<string>;
  recurringMismatches?: readonly RecurringMismatchInput[];
  limit?: number;
};

const PRIORITY_RANK: Record<PlanRecommendationPriority, number> = {
  [PlanRecommendationPriority.CRITICAL]: 1,
  [PlanRecommendationPriority.HIGH]: 2,
  [PlanRecommendationPriority.MEDIUM]: 3,
  [PlanRecommendationPriority.LOW]: 4,
};

const TYPE_RANK: Record<PlanRecommendationType, number> = {
  [PlanRecommendationType.JAR_OVERSPENT]: 1,
  [PlanRecommendationType.UNCATEGORIZED_TRANSACTIONS]: 2,
  [PlanRecommendationType.MISSING_QUALIFYING_INCOME]: 3,
  [PlanRecommendationType.PLAN_OVER_ALLOCATED]: 4,
  [PlanRecommendationType.GOAL_SOURCE_UNAVAILABLE]: 5,
  [PlanRecommendationType.GOAL_MISSING_BACKING]: 6,
  [PlanRecommendationType.GOAL_VALUATION_MISSING]: 7,
  [PlanRecommendationType.GOAL_READY_REGRESSION]: 8,
  [PlanRecommendationType.GOAL_TARGET_DATE_RISK]: 9,
  [PlanRecommendationType.JAR_NEAR_LIMIT]: 10,
  [PlanRecommendationType.GOAL_VALUATION_STALE]: 11,
  [PlanRecommendationType.RECURRING_AMOUNT_MISMATCH]: 12,
};

const TARGET_DATE_WINDOW_DAYS = 30;
const TARGET_PROGRESS_THRESHOLD = 80;
const RECURRING_MINIMUM_DIFFERENCE = 100_000;
const RECURRING_RELATIVE_DIFFERENCE = 0.1;

function safeInteger(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.trunc(value ?? 0) : 0;
}

function daysBetween(start: string, end: string): number {
  const days = differenceInUtcCalendarDays(start, end);
  return Number.isFinite(days) ? days : Number.POSITIVE_INFINITY;
}

function donorFor(
  sourceJarId: string,
  jars: readonly PlanJar[],
  budgetsByJar: Readonly<Record<string, JarBudgetMetrics>>,
): PlanJar | undefined {
  return jars
    .filter((jar) => {
      const metrics = budgetsByJar[jar.id];
      return (
        jar.id !== sourceJarId &&
        jar.state === JarState.ACTIVE &&
        Boolean(metrics && metrics.remainingAmount > 0)
      );
    })
    .sort((left, right) => {
      const remainingDifference =
        (budgetsByJar[right.id]?.remainingAmount ?? 0) -
        (budgetsByJar[left.id]?.remainingAmount ?? 0);
      return remainingDifference || left.id.localeCompare(right.id);
    })[0];
}

function actionForJar(
  jarId: string,
  donor: PlanJar | undefined,
  amount: number,
  isHistorical: boolean,
): PlanRecommendationAction {
  if (isHistorical) {
    return {
      type: "review_jar_rule",
      entityType: "jar",
      entityId: jarId,
    };
  }
  if (!donor) {
    return {
      type: "review_jar_budget",
      entityType: "jar",
      entityId: jarId,
    };
  }
  return {
    type: "reallocate_jar_budget",
    entityType: "jar",
    entityId: jarId,
    payload: {
      sourceJarId: donor.id,
      destinationJarId: jarId,
      suggestedAmount: amount,
    },
  };
}

function isMaterialMismatch(input: RecurringMismatchInput): boolean {
  const expected = Math.max(0, safeInteger(input.expectedAmount));
  const actual = Math.max(0, safeInteger(input.actualAmount));
  const difference = Math.abs(actual - expected);
  const relative =
    expected > 0 ? difference / expected : difference > 0 ? 1 : 0;
  return (
    difference >= RECURRING_MINIMUM_DIFFERENCE ||
    relative >= RECURRING_RELATIVE_DIFFERENCE
  );
}

function compareRecommendations(
  left: PlanRecommendation,
  right: PlanRecommendation,
): number {
  return (
    PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority] ||
    TYPE_RANK[left.type] - TYPE_RANK[right.type] ||
    left.id.localeCompare(right.id)
  );
}

/**
 * Builds current-state, display-only recommendations. It never writes data or
 * calls a mutation. Consumers localize titleKey/descriptionKey at render time.
 */
export function getPlanRecommendations(
  input: PlanRecommendationInput,
): PlanRecommendation[] {
  if (input.assistMode === PlanAssistMode.MANUAL) return [];

  const recommendations: PlanRecommendation[] = [];
  const isHistorical = Boolean(input.isHistorical);
  const qualifyingIncome = Math.max(0, safeInteger(input.qualifyingIncome));
  const activeJars = input.jars.filter((jar) => jar.state === JarState.ACTIVE);
  const allocation = calculateAllocationHealth(activeJars, qualifyingIncome);
  const overspentJarIds = new Set<string>();
  const unavailableGoalIds = new Set<string>();
  const missingValuationGoalIds = new Set<string>();

  for (const jar of activeJars) {
    const metrics = input.budgetsByJar[jar.id];
    if (!metrics) continue;
    if (metrics.state === JarBudgetState.OVERSPENT) {
      overspentJarIds.add(jar.id);
      const overspentAmount = Math.max(0, -metrics.remainingAmount);
      const donor = donorFor(jar.id, activeJars, input.budgetsByJar);
      const suggestedAmount = donor
        ? Math.min(
            overspentAmount,
            Math.max(0, input.budgetsByJar[donor.id]?.remainingAmount ?? 0),
          )
        : undefined;
      recommendations.push({
        id: `jar-overspent:${jar.id}:${input.periodMonth}`,
        type: PlanRecommendationType.JAR_OVERSPENT,
        priority: PlanRecommendationPriority.CRITICAL,
        titleKey: "recommendations.jarOverspent.title",
        descriptionKey: donor
          ? "recommendations.jarOverspent.withDonor"
          : "recommendations.jarOverspent.withoutDonor",
        reasonCode: "jar_overspent",
        reason: {
          jarId: jar.id,
          overspentAmount,
          donorJarId: donor?.id ?? null,
          donorAvailableAmount: donor
            ? (input.budgetsByJar[donor.id]?.remainingAmount ?? 0)
            : null,
        },
        amount: suggestedAmount ?? overspentAmount,
        entityType: "jar",
        entityId: jar.id,
        action: actionForJar(
          jar.id,
          donor,
          suggestedAmount ?? overspentAmount,
          isHistorical,
        ),
      });
    } else if (metrics.state === JarBudgetState.NEAR_LIMIT) {
      recommendations.push({
        id: `jar-near-limit:${jar.id}:${input.periodMonth}`,
        type: PlanRecommendationType.JAR_NEAR_LIMIT,
        priority: PlanRecommendationPriority.LOW,
        titleKey: "recommendations.jarNearLimit.title",
        descriptionKey: "recommendations.jarNearLimit.description",
        reasonCode: "jar_near_limit",
        reason: { jarId: jar.id, usagePercent: metrics.usagePercent },
        amount: metrics.remainingAmount,
        entityType: "jar",
        entityId: jar.id,
        action: {
          type: isHistorical ? "review_jar_rule" : "review_jar_budget",
          entityType: "jar",
          entityId: jar.id,
        },
      });
    }
  }

  if ((input.uncategorizedCount ?? 0) > 0) {
    recommendations.push({
      id: `uncategorized-transactions:${input.periodMonth}`,
      type: PlanRecommendationType.UNCATEGORIZED_TRANSACTIONS,
      priority: PlanRecommendationPriority.HIGH,
      titleKey: "recommendations.uncategorized.title",
      descriptionKey: "recommendations.uncategorized.description",
      reasonCode: "uncategorized_transactions",
      reason: { count: input.uncategorizedCount ?? 0 },
      entityType: "transaction",
      action: { type: "review_transactions", entityType: "transaction" },
    });
  }

  if (allocation.status === AllocationHealthStatus.NO_INCOME) {
    recommendations.push({
      id: `missing-qualifying-income:${input.periodMonth}`,
      type: PlanRecommendationType.MISSING_QUALIFYING_INCOME,
      priority: PlanRecommendationPriority.HIGH,
      titleKey: "recommendations.missingIncome.title",
      descriptionKey: "recommendations.missingIncome.description",
      reasonCode: "missing_qualifying_income",
      reason: { percentTotalBps: allocation.percentTotalBps },
      entityType: "plan",
      action: { type: "plan_settings", entityType: "plan" },
    });
  } else if (allocation.status === AllocationHealthStatus.OVER_ALLOCATED) {
    recommendations.push({
      id: `plan-over-allocated:${input.periodMonth}`,
      type: PlanRecommendationType.PLAN_OVER_ALLOCATED,
      priority: PlanRecommendationPriority.HIGH,
      titleKey: "recommendations.overAllocated.title",
      descriptionKey: "recommendations.overAllocated.description",
      reasonCode: "plan_over_allocated",
      reason: {
        qualifyingIncome,
        plannedOutlay: allocation.plannedOutlay,
        utilizationPercent: allocation.utilizationPercent,
        percentTotalBps: allocation.percentTotalBps,
      },
      amount: allocation.plannedOutlay - qualifyingIncome,
      entityType: "plan",
      action: { type: "plan_settings", entityType: "plan" },
    });
  }

  for (const goal of input.goals ?? []) {
    if (goal.status === GoalStatus.CANCELLED) continue;
    const unavailable = goal.fundingLinks.some(
      (link) =>
        link.availability === GoalFundingLinkAvailability.MISSING ||
        link.availability === GoalFundingLinkAvailability.UNAVAILABLE,
    );
    if (unavailable) {
      unavailableGoalIds.add(goal.id);
      recommendations.push({
        id: `goal-source-unavailable:${goal.id}`,
        type: PlanRecommendationType.GOAL_SOURCE_UNAVAILABLE,
        priority: PlanRecommendationPriority.HIGH,
        titleKey: "recommendations.goalSourceUnavailable.title",
        descriptionKey: "recommendations.goalSourceUnavailable.description",
        reasonCode: "goal_source_unavailable",
        reason: {
          goalId: goal.id,
          unavailableSourceCount: goal.fundingLinks.filter(
            (link) =>
              link.availability !== GoalFundingLinkAvailability.AVAILABLE,
          ).length,
        },
        entityType: "goal",
        entityId: goal.id,
        action: {
          type: "goal_funding_sources",
          entityType: "goal",
          entityId: goal.id,
        },
      });
      continue;
    }
    if (goal.backingState === GoalBackingState.NEEDS_BACKING) {
      recommendations.push({
        id: `goal-missing-backing:${goal.id}`,
        type: PlanRecommendationType.GOAL_MISSING_BACKING,
        priority: PlanRecommendationPriority.HIGH,
        titleKey: "recommendations.goalMissingBacking.title",
        descriptionKey: "recommendations.goalMissingBacking.description",
        reasonCode: "goal_missing_backing",
        reason: { goalId: goal.id },
        entityType: "goal",
        entityId: goal.id,
        action: {
          type: "goal_funding_sources",
          entityType: "goal",
          entityId: goal.id,
        },
      });
    }
    const valueStatus = goal.fundingValueStatus;
    const hasMissingValuation =
      valueStatus === GoalFundingQuality.MISSING ||
      valueStatus === GoalFundingQuality.INCOMPLETE;
    if (hasMissingValuation && goal.fundingLinks.length > 0) {
      missingValuationGoalIds.add(goal.id);
      recommendations.push({
        id: `goal-valuation-missing:${goal.id}`,
        type: PlanRecommendationType.GOAL_VALUATION_MISSING,
        priority: PlanRecommendationPriority.HIGH,
        titleKey: "recommendations.goalValuationMissing.title",
        descriptionKey: "recommendations.goalValuationMissing.description",
        reasonCode: "goal_valuation_missing",
        reason: { goalId: goal.id, valueStatus },
        entityType: "goal",
        entityId: goal.id,
        action: {
          type: "investment_detail",
          entityType: "goal",
          entityId: goal.id,
        },
      });
    } else if (valueStatus === GoalFundingQuality.STALE) {
      recommendations.push({
        id: `goal-valuation-stale:${goal.id}`,
        type: PlanRecommendationType.GOAL_VALUATION_STALE,
        priority: PlanRecommendationPriority.LOW,
        titleKey: "recommendations.goalValuationStale.title",
        descriptionKey: "recommendations.goalValuationStale.description",
        reasonCode: "goal_valuation_stale",
        reason: { goalId: goal.id },
        entityType: "goal",
        entityId: goal.id,
        action: {
          type: "investment_detail",
          entityType: "goal",
          entityId: goal.id,
        },
      });
    }
    if (
      input.previousReadyGoalIds?.has(goal.id) &&
      goal.status === GoalStatus.ACTIVE &&
      goal.progressPercent < 100
    ) {
      recommendations.push({
        id: `goal-ready-regression:${goal.id}`,
        type: PlanRecommendationType.GOAL_READY_REGRESSION,
        priority: PlanRecommendationPriority.MEDIUM,
        titleKey: "recommendations.goalReadyRegression.title",
        descriptionKey: "recommendations.goalReadyRegression.description",
        reasonCode: "goal_ready_regression",
        reason: { goalId: goal.id, progressPercent: goal.progressPercent },
        entityType: "goal",
        entityId: goal.id,
        action: { type: "goal_detail", entityType: "goal", entityId: goal.id },
      });
    }
    const asOfDate = input.asOfDate ?? new Date().toISOString().slice(0, 10);
    if (
      goal.targetDate &&
      goal.targetAmount > 0 &&
      goal.progressPercent < TARGET_PROGRESS_THRESHOLD &&
      daysBetween(asOfDate, goal.targetDate) >= 0 &&
      daysBetween(asOfDate, goal.targetDate) <= TARGET_DATE_WINDOW_DAYS
    ) {
      recommendations.push({
        id: `goal-target-date-risk:${goal.id}`,
        type: PlanRecommendationType.GOAL_TARGET_DATE_RISK,
        priority: PlanRecommendationPriority.MEDIUM,
        titleKey: "recommendations.goalTargetDate.title",
        descriptionKey: "recommendations.goalTargetDate.description",
        reasonCode: "goal_target_date_risk",
        reason: {
          goalId: goal.id,
          daysRemaining: daysBetween(asOfDate, goal.targetDate),
          progressPercent: goal.progressPercent,
        },
        entityType: "goal",
        entityId: goal.id,
        action: { type: "goal_detail", entityType: "goal", entityId: goal.id },
      });
    }
  }

  for (const mismatch of input.recurringMismatches ?? []) {
    if (!isMaterialMismatch(mismatch)) continue;
    recommendations.push({
      id: `recurring-amount-mismatch:${mismatch.id}:${input.periodMonth}`,
      type: PlanRecommendationType.RECURRING_AMOUNT_MISMATCH,
      priority: PlanRecommendationPriority.LOW,
      titleKey: "recommendations.recurringMismatch.title",
      descriptionKey: "recommendations.recurringMismatch.description",
      reasonCode: "recurring_amount_mismatch",
      reason: {
        recurringId: mismatch.id,
        expectedAmount: safeInteger(mismatch.expectedAmount),
        actualAmount: safeInteger(mismatch.actualAmount),
      },
      amount: Math.abs(
        safeInteger(mismatch.actualAmount) -
          safeInteger(mismatch.expectedAmount),
      ),
      entityType: "recurring",
      entityId: mismatch.id,
      action: {
        type: "recurring_detail",
        entityType: "recurring",
        entityId: mismatch.id,
      },
    });
  }

  // A missing source is more actionable than any valuation quality warning for
  // the same Goal. Overspending also owns the Jar's near-limit state.
  return recommendations
    .filter((recommendation) => {
      if (
        recommendation.type === PlanRecommendationType.JAR_NEAR_LIMIT &&
        recommendation.entityId &&
        overspentJarIds.has(recommendation.entityId)
      )
        return false;
      if (
        (recommendation.type === PlanRecommendationType.GOAL_VALUATION_STALE ||
          recommendation.type ===
            PlanRecommendationType.GOAL_VALUATION_MISSING) &&
        recommendation.entityId &&
        unavailableGoalIds.has(recommendation.entityId)
      )
        return false;
      if (
        recommendation.type === PlanRecommendationType.GOAL_VALUATION_STALE &&
        recommendation.entityId &&
        missingValuationGoalIds.has(recommendation.entityId)
      )
        return false;
      return true;
    })
    .sort(compareRecommendations)
    .slice(0, input.limit ?? 3);
}

/** Backwards-compatible adapter for Plan 06/07 callers during migration. */
export function buildAssistedSuggestions(input: {
  assistMode: string;
  budgetsByJar: Record<string, JarBudgetMetrics>;
  jars: readonly Pick<PlanJar, "id" | "name">[];
  uncategorizedCount: number;
  goalsMissingBacking?: readonly Pick<PlanGoal, "id" | "name">[];
  allocationOverPercent?: number;
}): PlanRecommendation[] {
  const jars = input.jars.map((jar) => ({
    ...jar,
    state: JarState.ACTIVE,
    kind: JarKind.SPENDING,
    sortOrder: 0,
    capacityDelta: 0,
    rolloverMode: JarRolloverMode.RESET,
    plan: null,
  }));
  const goals = (input.goalsMissingBacking ?? []).map((goal) => ({
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
  }));
  return getPlanRecommendations({
    assistMode: input.assistMode,
    periodMonth: PlanRecommendationPeriodKey.CURRENT,
    jars,
    budgetsByJar: input.budgetsByJar,
    uncategorizedCount: input.uncategorizedCount,
    goals,
    limit: 5,
  });
}
