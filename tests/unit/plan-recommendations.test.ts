import { describe, expect, it } from "vitest";
import {
  getPlanRecommendations,
  PlanRecommendationType,
} from "@/modules/plan/application/plan-recommendations";
import {
  GoalStatus,
  GoalType,
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  JarState,
  PlanAssistMode,
} from "@/modules/plan/application/plan-constants";
import type { PlanGoal } from "@/modules/plan/application/goal-recurring-types";
import type { PlanJar } from "@/modules/plan/application/jar-types";
import type { JarBudgetMetrics } from "@/modules/plan/application/jar-budget";

const metrics = (
  remainingAmount: number,
  state: JarBudgetMetrics["state"],
  usagePercent = 0,
): JarBudgetMetrics => ({
  budgetAmount: Math.max(0, remainingAmount),
  spentAmount: 0,
  remainingAmount,
  usagePercent,
  state,
  ruleBudget: Math.max(0, remainingAmount),
  rolloverCredit: 0,
  periodAdjustment: 0,
  qualifyingIncome: 0,
});
const jar = (
  id: string,
  plan: PlanJar["plan"] = {
    kind: JarPlanKind.FIXED,
    fixedAmount: 10,
    percentBps: 0,
  },
): PlanJar => ({
  id,
  name: id,
  kind: JarKind.SPENDING,
  state: JarState.ACTIVE,
  sortOrder: 0,
  capacityDelta: 0,
  rolloverMode: JarRolloverMode.RESET,
  plan,
});
const goal = (overrides: Partial<PlanGoal> = {}): PlanGoal => ({
  id: "goal-1",
  name: "Buy a car",
  targetAmount: 100,
  fundedAmount: 50,
  targetDate: null,
  status: GoalStatus.ACTIVE,
  goalType: GoalType.SAVE_UP,
  fundingLinks: [],
  backingState: "linked",
  fundingValueStatus: "current",
  fundingSummary: null,
  isLegacyIntention: false,
  progressPercent: 50,
  ...overrides,
});
const base = (
  overrides: Partial<Parameters<typeof getPlanRecommendations>[0]> = {},
) => ({
  assistMode: PlanAssistMode.ASSISTED,
  periodMonth: "2026-08-01",
  jars: [jar("lifestyle")],
  budgetsByJar: { lifestyle: metrics(10, "healthy") },
  qualifyingIncome: 100,
  ...overrides,
});

describe("getPlanRecommendations", () => {
  it("shows an Assisted overspending recommendation with the largest deterministic donor", () => {
    const result = getPlanRecommendations(
      base({
        jars: [jar("lifestyle"), jar("buffer"), jar("small")],
        budgetsByJar: {
          lifestyle: metrics(-2, "overspent", 120),
          buffer: metrics(5, "healthy", 10),
          small: metrics(5, "healthy", 10),
        },
      }),
    );
    expect(result[0]).toMatchObject({
      type: PlanRecommendationType.JAR_OVERSPENT,
      amount: 2,
      entityId: "lifestyle",
      action: { type: "reallocate_jar_budget" },
    });
    expect(result[0]?.reason.donorJarId).toBe("buffer");
  });
  it("suggests only the available donor amount when the donor is insufficient", () => {
    const result = getPlanRecommendations(
      base({
        jars: [jar("lifestyle"), jar("buffer")],
        budgetsByJar: {
          lifestyle: metrics(-5, "overspent"),
          buffer: metrics(2, "healthy"),
        },
      }),
    );
    expect(result[0]).toMatchObject({
      type: PlanRecommendationType.JAR_OVERSPENT,
      amount: 2,
    });
    expect(result[0]?.descriptionKey).toContain("withDonor");
  });
  it("does not invent a donor when no active Jar has capacity", () => {
    const result = getPlanRecommendations(
      base({ budgetsByJar: { lifestyle: metrics(-5, "overspent") } }),
    );
    expect(result[0]).toMatchObject({
      type: PlanRecommendationType.JAR_OVERSPENT,
      action: { type: "review_jar_budget" },
    });
    expect(result[0]?.reason.donorJarId).toBeNull();
  });
  it("keeps factual inputs available to Manual callers while hiding recommendations", () => {
    const result = getPlanRecommendations(
      base({
        assistMode: PlanAssistMode.MANUAL,
        budgetsByJar: { lifestyle: metrics(-2, "overspent") },
      }),
    );
    expect(result).toEqual([]);
  });
  it("suppresses near-limit for overspent Jars and stale valuation for missing valuation", () => {
    const result = getPlanRecommendations(
      base({
        budgetsByJar: { lifestyle: metrics(-2, "overspent", 120) },
        goals: [
          goal({
            fundingValueStatus: "missing",
            fundingLinks: [
              {
                id: "link",
                kind: "investment",
                sourceId: "holding",
                sourceName: "Holding",
                currentAmount: 0,
                availability: "available",
              },
            ],
          }),
        ],
      }),
    );
    expect(
      result.some(
        (item) => item.type === PlanRecommendationType.JAR_NEAR_LIMIT,
      ),
    ).toBe(false);
    expect(
      result.some(
        (item) => item.type === PlanRecommendationType.GOAL_VALUATION_STALE,
      ),
    ).toBe(false);
    expect(
      result.some(
        (item) => item.type === PlanRecommendationType.GOAL_VALUATION_MISSING,
      ),
    ).toBe(true);
  });
  it("prioritizes missing income and over-allocation using existing allocation semantics", () => {
    const missing = getPlanRecommendations(
      base({
        jars: [
          jar("percent", {
            kind: JarPlanKind.PERCENT,
            percentBps: 5000,
            fixedAmount: 0,
          }),
        ],
        qualifyingIncome: 0,
      }),
    );
    expect(missing[0]?.type).toBe(
      PlanRecommendationType.MISSING_QUALIFYING_INCOME,
    );
    const over = getPlanRecommendations(
      base({
        jars: [
          jar("fixed", {
            kind: JarPlanKind.FIXED,
            percentBps: 0,
            fixedAmount: 120,
          }),
        ],
        qualifyingIncome: 100,
      }),
    );
    expect(over[0]?.type).toBe(PlanRecommendationType.PLAN_OVER_ALLOCATED);
  });
  it("emits reliable Goal backing and target-date recommendations", () => {
    const result = getPlanRecommendations(
      base({
        asOfDate: "2026-08-01",
        goals: [
          goal({ backingState: "needs_backing" }),
          goal({
            id: "goal-2",
            name: "Trip",
            targetDate: "2026-08-20",
            progressPercent: 20,
            backingState: "linked",
          }),
        ],
      }),
    );
    expect(
      result.some(
        (item) => item.type === PlanRecommendationType.GOAL_MISSING_BACKING,
      ),
    ).toBe(true);
    expect(
      result.some(
        (item) => item.type === PlanRecommendationType.GOAL_TARGET_DATE_RISK,
      ),
    ).toBe(true);
  });

  it("uses UTC calendar days across month and year boundaries", () => {
    const result = getPlanRecommendations(
      base({
        asOfDate: "2025-12-31",
        goals: [
          goal({
            targetDate: "2026-01-01",
            progressPercent: 20,
          }),
        ],
      }),
    );

    expect(
      result.find(
        (item) => item.type === PlanRecommendationType.GOAL_TARGET_DATE_RISK,
      )?.reason.daysRemaining,
    ).toBe(1);
  });
  it("flags only material recurring mismatches", () => {
    const result = getPlanRecommendations(
      base({
        recurringMismatches: [
          {
            id: "internet",
            name: "Internet",
            expectedAmount: 400,
            actualAmount: 550,
          },
          {
            id: "small",
            name: "Small",
            expectedAmount: 400000,
            actualAmount: 405000,
          },
        ],
      }),
    );
    expect(
      result.some(
        (item) =>
          item.type === PlanRecommendationType.RECURRING_AMOUNT_MISMATCH &&
          item.entityId === "internet",
      ),
    ).toBe(true);
    expect(result.some((item) => item.entityId === "small")).toBe(false);
  });
  it("uses a review action for historical overspending instead of current reallocation", () => {
    const result = getPlanRecommendations(
      base({
        isHistorical: true,
        budgetsByJar: { lifestyle: metrics(-2, "overspent") },
      }),
    );
    expect(result[0]?.action?.type).toBe("review_jar_rule");
  });
});
