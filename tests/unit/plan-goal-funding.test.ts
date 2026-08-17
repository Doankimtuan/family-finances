import { describe, expect, it } from "vitest";
import {
  calculateGoalProgressPercent,
  deriveGoalFundingSummary,
  deriveGoalFundedAmount,
  hasExclusiveGoalFundingConflict,
  resolveGoalFundingStatus,
} from "@/modules/plan/application/goal-funding";
import {
  GoalFundingSourceKind,
  GoalStatus,
  GoalType,
} from "@/modules/plan/application/plan-constants";
import { mapGoalRow } from "@/modules/plan/application/goal-recurring-types";

const saving = (amount: number) => ({
  kind: GoalFundingSourceKind.SAVING,
  sourceId: "saving-1",
  currentAmount: amount,
});

describe("PLAN 09 derived Goal funding", () => {
  it("uses authoritative Savings principal and decreases after withdrawal", () => {
    expect(
      calculateGoalProgressPercent(
        deriveGoalFundedAmount([saving(250_000_000)]),
        500_000_000,
      ),
    ).toBe(50);
    expect(
      calculateGoalProgressPercent(
        deriveGoalFundedAmount([saving(200_000_000)]),
        500_000_000,
      ),
    ).toBe(40);
  });

  it("uses investment market value as primary value and cost basis as context", () => {
    const summary = deriveGoalFundingSummary([
      {
        kind: GoalFundingSourceKind.HOLDING,
        sourceId: "holding-1",
        currentValue: 120_000_000,
        costBasis: 100_000_000,
      },
    ]);
    expect(summary.fundedAmount).toBe(120_000_000);
    expect(summary.costBasis).toBe(100_000_000);
    expect(summary.unrealizedGainLoss).toBe(20_000_000);
  });

  it("does not substitute cost basis when valuation is missing", () => {
    const summary = deriveGoalFundingSummary([
      {
        kind: GoalFundingSourceKind.HOLDING,
        sourceId: "holding-1",
        costBasis: 100_000_000,
        valueStatus: "missing",
      },
    ]);
    expect(summary.fundedAmount).toBe(0);
    expect(summary.valueStatus).toBe("missing");
    expect(summary.costBasis).toBe(100_000_000);
  });

  it("includes stale market value but marks the aggregate stale", () => {
    const summary = deriveGoalFundingSummary([
      {
        kind: GoalFundingSourceKind.HOLDING,
        sourceId: "holding-1",
        currentValue: 120_000_000,
        costBasis: 100_000_000,
        valueStatus: "stale",
      },
    ]);
    expect(summary.fundedAmount).toBe(120_000_000);
    expect(summary.valueStatus).toBe("stale");
  });

  it("aggregates Savings and Investment market value without double counting", () => {
    expect(
      deriveGoalFundedAmount([
        saving(250_000_000),
        {
          kind: GoalFundingSourceKind.HOLDING,
          sourceId: "holding-1",
          currentValue: 120_000_000,
          costBasis: 100_000_000,
        },
      ]),
    ).toBe(370_000_000);
  });

  it("derives payoff progress from original minus remaining principal", () => {
    const summary = deriveGoalFundingSummary([
      {
        kind: GoalFundingSourceKind.LOAN,
        sourceId: "loan-1",
        originalPrincipal: 1_000_000_000,
        remainingPrincipal: 700_000_000,
      },
    ]);
    expect(summary.fundedAmount).toBe(300_000_000);
    expect(summary.originalPrincipalTotal).toBe(1_000_000_000);
    expect(summary.remainingPrincipalTotal).toBe(700_000_000);
    expect(summary.principalPaidTotal).toBe(300_000_000);
  });

  it("supports partially repaid debt immediately and clamps refinance increases", () => {
    expect(
      deriveGoalFundedAmount([
        {
          kind: GoalFundingSourceKind.DEBT,
          sourceId: "debt-1",
          initialPrincipalSnapshot: 1_000,
          remainingPrincipal: 700,
        },
      ]),
    ).toBe(300);
    expect(
      deriveGoalFundedAmount([
        {
          kind: GoalFundingSourceKind.DEBT,
          sourceId: "debt-1",
          initialPrincipalSnapshot: 1_000,
          remainingPrincipal: 1_100,
        },
      ]),
    ).toBe(0);
  });

  it("aggregates multiple payoff sources", () => {
    expect(
      deriveGoalFundedAmount([
        {
          kind: GoalFundingSourceKind.LOAN,
          sourceId: "loan-a",
          originalPrincipal: 500,
          remainingPrincipal: 400,
        },
        {
          kind: GoalFundingSourceKind.DEBT,
          sourceId: "debt-b",
          originalPrincipal: 300,
          remainingPrincipal: 250,
        },
      ]),
    ).toBe(150);
  });

  it("supports Ready regression while preserving paused and terminal lifecycle states", () => {
    expect(resolveGoalFundingStatus(GoalStatus.ACTIVE, 500, 500)).toBe(
      GoalStatus.READY,
    );
    expect(resolveGoalFundingStatus(GoalStatus.READY, 480, 500)).toBe(
      GoalStatus.ACTIVE,
    );
    expect(resolveGoalFundingStatus(GoalStatus.PAUSED, 600, 500)).toBe(
      GoalStatus.PAUSED,
    );
    expect(resolveGoalFundingStatus(GoalStatus.COMPLETED, 100, 500)).toBe(
      GoalStatus.COMPLETED,
    );
    expect(resolveGoalFundingStatus(GoalStatus.CANCELLED, 600, 500)).toBe(
      GoalStatus.CANCELLED,
    );
  });

  it("keeps linked Goals derived and isolated from legacy manual progress", () => {
    const goal = mapGoalRow(
      {
        id: "goal-1",
        name: "Linked",
        target_amount: 500,
        funded_amount: 100,
        legacy_funded_amount: 100,
        target_date: null,
        status: "active",
        goal_type: GoalType.SAVE_UP,
      },
      {
        fundingLinks: [
          {
            id: "link-1",
            kind: GoalFundingSourceKind.SAVING,
            sourceId: "saving-1",
            sourceName: "Savings",
            currentAmount: 300,
          },
        ],
        fundingSummary: deriveGoalFundingSummary([saving(300)]),
      },
    );
    expect(goal.fundedAmount).toBe(300);
    expect(goal.fundingSummary?.fundedAmount).toBe(300);
  });

  it("detects exclusive linked sources", () => {
    expect(
      hasExclusiveGoalFundingConflict(
        [
          {
            goalId: "goal-1",
            kind: GoalFundingSourceKind.SAVINGS_ACCOUNT,
            sourceId: "account-1",
            isActive: true,
          },
        ],
        {
          goalId: "goal-2",
          kind: GoalFundingSourceKind.SAVINGS_ACCOUNT,
          sourceId: "account-1",
        },
      ),
    ).toBe(true);
  });
});

describe("calculateGoalProgressPercent boundaries", () => {
  it("returns 0 when nothing is funded", () => {
    expect(calculateGoalProgressPercent(0, 500_000_000)).toBe(0);
  });

  it("returns partial progress below 100", () => {
    expect(calculateGoalProgressPercent(150_000_000, 500_000_000)).toBe(30);
  });

  it("returns exactly 100 at the target", () => {
    expect(calculateGoalProgressPercent(500_000_000, 500_000_000)).toBe(100);
  });

  it("keeps over-funded progress above 100", () => {
    expect(calculateGoalProgressPercent(750_000_000, 500_000_000)).toBe(150);
  });

  it("returns 0 for zero, negative, or non-finite targets", () => {
    expect(calculateGoalProgressPercent(400, 0)).toBe(0);
    expect(calculateGoalProgressPercent(400, -100)).toBe(0);
    expect(calculateGoalProgressPercent(400, Number.NaN)).toBe(0);
    expect(calculateGoalProgressPercent(400, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("treats negative funded amounts as 0, truncates fractions, and rounds to two decimals", () => {
    expect(calculateGoalProgressPercent(-50, 500)).toBe(0);
    expect(calculateGoalProgressPercent(100.9, 100)).toBe(100);
    expect(calculateGoalProgressPercent(1, 300)).toBe(0.33);
  });
});
