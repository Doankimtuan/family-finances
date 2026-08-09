import { describe, expect, it } from "vitest";
import {
  InterestCalcMethod,
  PenaltyStrategy,
  SettlementRule,
  RenewalPolicy,
} from "@/modules/savings/application/savings-constants";
import {
  calculateInterest,
  computeFullTermInterest,
} from "@/modules/savings/application/savings-interest";
import {
  previewEarlyWithdrawal,
  shouldWarnPenalty,
} from "@/modules/savings/application/savings-penalty";
import type { PackageSnapshot } from "@/modules/savings/application/savings-types";
import { instantiateTypedReviewItem } from "@/modules/inbox/application/review-item-schemas";
import {
  InboxItemKind,
  ReviewItemType,
} from "@/modules/inbox/application/inbox-constants";
import {
  shouldAutoResolveInboxItem,
  shouldCancelMaturityCascade,
} from "@/modules/inbox/application/inbox-resolution-policy";

describe("savings interest engine", () => {
  it("computes simple interest for a full term", () => {
    const interest = computeFullTermInterest({
      principal: 100_000_000,
      annualRate: 6.5,
      durationDays: 365,
      method: InterestCalcMethod.SIMPLE,
    });
    expect(interest).toBe(6_500_000);
  });

  it("computes partial accrued interest", () => {
    const result = calculateInterest({
      principal: 10_000_000,
      annualRate: 3.65,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      method: InterestCalcMethod.SIMPLE,
      asOfDate: "2026-01-11",
    });
    expect(result.daysElapsed).toBe(10);
    expect(result.totalInterest).toBe(10_000);
  });
});

describe("savings early withdrawal penalty", () => {
  const packageSnapshot: PackageSnapshot = {
    packageName: "90 Days",
    durationDays: 90,
    annualInterestRate: 4.5,
    settlementRules: [SettlementRule.WITHDRAW_EVERYTHING],
    penaltyRules: [{ strategy: PenaltyStrategy.NO_INTEREST }],
    renewableAvailable: true,
    minAmount: null,
    maxAmount: null,
  };

  it("forfeits interest under no_interest strategy", () => {
    const preview = previewEarlyWithdrawal({
      principal: 10_000_000,
      annualRate: 4.5,
      startDate: "2026-01-01",
      endDate: "2026-04-01",
      withdrawalDate: "2026-02-01",
      interestMethod: InterestCalcMethod.SIMPLE,
      packageSnapshot,
    });
    expect(preview.quoteReady).toBe(true);
    expect(preview.eligibleInterest).toBe(0);
    expect(preview.netReturned).toBe(preview.principal);
    expect(shouldWarnPenalty(preview)).toBe(preview.accruedInterest > 0);
  });

  it("applies demand interest when configured", () => {
    const preview = previewEarlyWithdrawal({
      principal: 10_000_000,
      annualRate: 4.5,
      startDate: "2026-01-01",
      endDate: "2026-04-01",
      withdrawalDate: "2026-02-01",
      interestMethod: InterestCalcMethod.SIMPLE,
      packageSnapshot: {
        ...packageSnapshot,
        penaltyRules: [
          { strategy: PenaltyStrategy.DEMAND_INTEREST, demandRate: 0.5 },
        ],
      },
    });
    expect(preview.quoteReady).toBe(true);
    expect(preview.eligibleInterest).toBeGreaterThanOrEqual(0);
    expect(preview.eligibleInterest ?? -1).toBeLessThanOrEqual(
      preview.accruedInterest,
    );
  });

  it("leaves provider formula amounts unknown without evaluating expressions", () => {
    const preview = previewEarlyWithdrawal({
      principal: 10_000_000,
      annualRate: 4.5,
      startDate: "2026-01-01",
      endDate: "2026-04-01",
      withdrawalDate: "2026-02-01",
      interestMethod: InterestCalcMethod.SIMPLE,
      packageSnapshot: {
        ...packageSnapshot,
        penaltyRules: [
          {
            strategy: PenaltyStrategy.PROVIDER_FORMULA,
            formulaExpression: "accruedInterest * 0.7",
          },
        ],
      },
    });
    expect(preview.quoteReady).toBe(false);
    expect(preview.eligibleInterest).toBeNull();
    expect(preview.penaltyAmount).toBeNull();
    expect(preview.netReturned).toBeNull();
    expect(shouldWarnPenalty(preview)).toBe(false);
  });
});

describe("savings inbox typing", () => {
  it("hydrates SavingsMaturityDecision from context_json", () => {
    const typed = instantiateTypedReviewItem({
      kind: InboxItemKind.SAVINGS_MATURED,
      sourceId: "11111111-1111-1111-1111-111111111111",
      contextJson: {
        savingId: "11111111-1111-1111-1111-111111111111",
        cycleId: "22222222-2222-2222-2222-222222222222",
        providerName: "Manual Saving",
        currentPackage: "90 Days",
        currentRate: 4.5,
        previousRate: 3.5,
        rateDifference: 1,
        recommendedPackages: [],
        estimatedInterest: 1000,
        configuredRenewalPreference: RenewalPolicy.ALWAYS_ASK,
        settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
        principal: 1_000_000,
        accruedInterest: 1000,
        maturityDate: "2026-08-01",
      },
    });

    expect(typed?.type).toBe(ReviewItemType.SAVINGS_MATURITY_DECISION);
    expect(typed && "payload" in typed ? typed.payload.providerName : "").toBe(
      "Manual Saving",
    );
    expect(typed && "payload" in typed ? typed.payload.principal : 0).toBe(
      1_000_000,
    );
  });

  it("never auto-resolves savings maturity kinds", () => {
    expect(
      shouldAutoResolveInboxItem({
        kind: InboxItemKind.SAVINGS_MATURED,
        confidenceScore: 1,
        suggestedJarId: "11111111-1111-1111-1111-111111111111",
      }),
    ).toBe(false);
    expect(
      shouldCancelMaturityCascade({
        kind: InboxItemKind.SAVINGS_MATURED,
        resolved: true,
      }),
    ).toBe(true);
  });
});
