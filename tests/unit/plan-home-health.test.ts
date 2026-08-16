import { describe, expect, it } from "vitest";
import {
  collectPlanHomeExceptions,
  prioritizePlanHomeExceptions,
  resolvePlanHomeHealth,
  PlanHomeHealthStatus,
} from "@/modules/plan/application/plan-home-health";

type Metrics = {
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercent: number;
  state: "healthy" | "near_limit" | "overspent" | "no_spending" | "no_budget";
};

const metric = (state: Metrics["state"], remainingAmount = 100): Metrics => ({
  budgetAmount: 1_000,
  spentAmount: 900,
  remainingAmount,
  usagePercent: state === "overspent" ? 120 : 90,
  state,
});

describe("Plan Home health", () => {
  it("returns no_plan when there are no active Jars", () => {
    expect(
      resolvePlanHomeHealth({
        activeJarCount: 0,
        budgets: [],
        uncategorizedCount: 0,
      }),
    ).toBe(PlanHomeHealthStatus.NO_PLAN);
  });

  it("returns healthy for configured Jars without current exceptions", () => {
    expect(
      resolvePlanHomeHealth({
        activeJarCount: 1,
        budgets: [metric("healthy")],
        uncategorizedCount: 0,
      }),
    ).toBe(PlanHomeHealthStatus.HEALTHY);
  });

  it("returns attention for a near-limit Jar or unmapped expenses", () => {
    expect(
      resolvePlanHomeHealth({
        activeJarCount: 1,
        budgets: [metric("near_limit")],
        uncategorizedCount: 0,
      }),
    ).toBe(PlanHomeHealthStatus.ATTENTION);
    expect(
      resolvePlanHomeHealth({
        activeJarCount: 1,
        budgets: [metric("healthy")],
        uncategorizedCount: 2,
      }),
    ).toBe(PlanHomeHealthStatus.ATTENTION);
  });

  it("returns off_track for overspending, not for minor classification work", () => {
    expect(
      resolvePlanHomeHealth({
        activeJarCount: 1,
        budgets: [metric("overspent", -200)],
        uncategorizedCount: 0,
      }),
    ).toBe(PlanHomeHealthStatus.OFF_TRACK);
  });
});

describe("Plan Home exceptions", () => {
  it("keeps the factual overspent amount and usage visible", () => {
    const exceptions = collectPlanHomeExceptions({
      budgetsByJar: { essentials: metric("overspent", -200) },
      jars: [{ id: "essentials", name: "Essentials" }],
      uncategorizedCount: 0,
    });
    expect(exceptions[0]).toMatchObject({
      kind: "overspent_jar",
      amount: 200,
      percent: 120,
    });
  });

  it("prioritizes overspending and caps the Home list", () => {
    const prioritized = prioritizePlanHomeExceptions([
      { kind: "near_limit_jar", jarId: "near", jarName: "Near" },
      { kind: "goal_backing", goalId: "goal", goalName: "Goal" },
      { kind: "overspent_jar", jarId: "over", jarName: "Over" },
      { kind: "uncategorized", count: 3 },
    ]);
    expect(prioritized.map((item) => item.kind)).toEqual([
      "overspent_jar",
      "uncategorized",
      "near_limit_jar",
    ]);
  });
});
