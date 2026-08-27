import { describe, expect, it } from "vitest";
import {
  InterestCalcMethod,
  PenaltyStrategy,
  SettlementRule,
  RenewalPolicy,
  SavingType,
  SavingsFamily,
  savingsFamilyForType,
  CycleStatus,
  SavingStatus,
  SavingsCreateMode,
} from "@/modules/savings/application/savings-constants";
import {
  addSavingsTerm,
  SavingsTermUnit,
  SavingsTaxRule,
  minimumSavingsStartDate,
} from "@/modules/savings/application/savings-domain-rules";
import {
  calculateInterest,
  computeFullTermInterest,
} from "@/modules/savings/application/savings-interest";
import { differenceInUtcCalendarDays } from "@/shared/utils/iso-date";
import {
  previewEarlyWithdrawal,
  shouldWarnPenalty,
} from "@/modules/savings/application/savings-penalty";
import type {
  PackageSnapshot,
  Saving,
  SavingCycle,
} from "@/modules/savings/application/savings-types";
import { selectCurrentSavingCycle } from "@/modules/savings/application/savings-types";
import {
  buildSavingsDetailModel,
  buildSavingsOverviewModel,
  MaturityPresentationState,
} from "@/modules/savings/application/savings-presentation";
import { instantiateTypedReviewItem } from "@/modules/inbox/application/review-item-schemas";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import {
  shouldAutoResolveInboxItem,
  shouldCancelMaturityCascade,
} from "@/modules/inbox/application/inbox-resolution-policy";
import { calculateSettlementBreakdown } from "@/modules/savings/application/savings-domain-rules";
import { createSavingInputSchema } from "@/modules/savings/application/commands/create-saving.schema";

describe("savings interest engine", () => {
  it("enforces positive whole principal and required creation identifiers", () => {
    const valid = createSavingInputSchema.safeParse({
      fundingAccountId: "11111111-1111-4111-8111-111111111111",
      settlementAccountId: "22222222-2222-4222-8222-222222222222",
      providerId: "33333333-3333-4333-8333-333333333333",
      packageId: "44444444-4444-4444-8444-444444444444",
      productName: "Family deposit",
      principal: 10_000_000,
      startDate: "2026-01-15",
    });
    expect(valid.success).toBe(true);
    const historical = createSavingInputSchema.safeParse({
      ...(valid.success ? valid.data : {}),
      creationMode: SavingsCreateMode.HISTORICAL_OPENING,
      fundingAccountId: null,
      productName: "Existing term deposit",
    });
    expect(historical.success).toBe(true);
    expect(
      createSavingInputSchema.safeParse({
        ...(valid.success ? valid.data : {}),
        principal: 0,
      }).success,
    ).toBe(false);
  });

  it("computes simple interest for a full term", () => {
    const interest = computeFullTermInterest({
      principal: 100_000_000,
      annualRate: 6.5,
      durationDays: 365,
      method: InterestCalcMethod.SIMPLE,
    });
    expect(interest).toBe(6_500_000);
  });

  it("requires a catalog package for historical openings", () => {
    const result = createSavingInputSchema.safeParse({
      creationMode: SavingsCreateMode.HISTORICAL_OPENING,
      fundingAccountId: null,
      settlementAccountId: "22222222-2222-4222-8222-222222222222",
      providerId: "33333333-3333-4333-8333-333333333333",
      productName: "Family deposit",
      packageId: null,
      principal: 10_000_000,
      startDate: "2026-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a historical opening dated today", () => {
    const result = createSavingInputSchema.safeParse({
      creationMode: SavingsCreateMode.HISTORICAL_OPENING,
      fundingAccountId: null,
      settlementAccountId: "22222222-2222-4222-8222-222222222222",
      providerId: "33333333-3333-4333-8333-333333333333",
      productName: "Family deposit",
      packageId: "44444444-4444-4444-8444-444444444444",
      principal: 10_000_000,
      startDate: new Date().toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
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

  it("counts UTC calendar days without partial-day drift", () => {
    expect(
      differenceInUtcCalendarDays(
        "2026-01-01T23:30:00.000Z",
        "2026-01-01T23:59:00.000Z",
      ),
    ).toBe(0);
    expect(
      differenceInUtcCalendarDays(
        "2026-01-01T23:30:00.000Z",
        "2026-01-02T00:15:00.000Z",
      ),
    ).toBe(1);
    expect(differenceInUtcCalendarDays("2024-02-28", "2024-03-01")).toBe(2);
    expect(differenceInUtcCalendarDays("2025-12-31", "2026-01-01")).toBe(1);
    expect(differenceInUtcCalendarDays("2026-01-02", "2026-01-01")).toBe(-1);
  });

  it("uses the same day count for interest at the maturity boundary", () => {
    const sameDay = calculateInterest({
      principal: 1_000_000,
      annualRate: 36.5,
      startDate: "2026-01-01T08:00:00.000Z",
      endDate: "2026-01-01T23:00:00.000Z",
      method: InterestCalcMethod.SIMPLE,
    });
    const result = calculateInterest({
      principal: 1_000_000,
      annualRate: 36.5,
      startDate: "2026-01-01T23:30:00.000Z",
      endDate: "2026-01-02T00:15:00.000Z",
      method: InterestCalcMethod.SIMPLE,
    });
    expect(sameDay.daysElapsed).toBe(0);
    expect(sameDay.totalInterest).toBe(0);
    expect(result.daysElapsed).toBe(1);
    expect(result.totalInterest).toBe(1_000);
  });
});

describe("maturity rollover money", () => {
  it("rolls only after tax is deducted", () => {
    const result = calculateSettlementBreakdown({
      principal: 100_000,
      grossInterest: 150,
      taxRule: SavingsTaxRule.PROFIT_PERCENTAGE,
      taxRatePercent: 10,
    });
    expect(result.tax).toBe(15);
    expect(result.netInterest).toBe(135);
    expect(result.totalCashReceived).toBe(100_135);
  });
});

describe("savings product family", () => {
  it("maps bank deposits to the bank family", () => {
    expect(savingsFamilyForType(SavingType.BANK_DEPOSIT)).toBe(
      SavingsFamily.BANK,
    );
  });

  it("maps digital, flexible, and manual products to the platform family", () => {
    expect(savingsFamilyForType(SavingType.DIGITAL_SAVING)).toBe(
      SavingsFamily.PLATFORM,
    );
    expect(savingsFamilyForType(SavingType.FLEXIBLE_SAVING)).toBe(
      SavingsFamily.PLATFORM,
    );
    expect(savingsFamilyForType(SavingType.MANUAL_SAVING)).toBe(
      SavingsFamily.PLATFORM,
    );
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
    expect(preview.daysHeld).toBe(31);
    expect(preview.totalTermDays).toBe(90);
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

  it("uses the persisted early rate and charges tax and penalty from gross interest", () => {
    const preview = previewEarlyWithdrawal({
      principal: 1_000_000,
      annualRate: 10,
      startDate: "2026-01-01",
      endDate: "2027-01-01",
      withdrawalDate: "2026-02-01",
      interestMethod: InterestCalcMethod.SIMPLE,
      packageSnapshot: {
        ...packageSnapshot,
        annualInterestRate: 10,
        penaltyRules: [],
        earlySettlementRule: "CUSTOM_RATE",
        earlySettlementRatePercent: 1.5,
        taxRule: SavingsTaxRule.PROFIT_PERCENTAGE,
        taxRatePercent: 5,
      },
    });

    expect(preview.accruedInterest).toBe(8_493);
    expect(preview.eligibleInterest).toBe(1_273);
    expect(preview.penaltyAmount).toBe(7_220);
    expect(preview.taxAmount).toBe(424);
    expect(preview.netInterest).toBe(849);
    expect(preview.netReturned).toBe(1_000_849);
  });

  it("counts a same-day early withdrawal as zero held days", () => {
    const preview = previewEarlyWithdrawal({
      principal: 10_000_000,
      annualRate: 4.5,
      startDate: "2026-02-01",
      endDate: "2026-05-02",
      withdrawalDate: "2026-02-01",
      interestMethod: InterestCalcMethod.SIMPLE,
      packageSnapshot,
    });
    expect(preview.daysHeld).toBe(0);
    expect(preview.totalTermDays).toBe(90);
    expect(preview.accruedInterest).toBe(0);
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
      kind: InboxItemKind.SAVINGS_MATURITY,
      sourceId: "11111111-1111-4111-8111-111111111111",
      contextJson: {
        savingId: "11111111-1111-4111-8111-111111111111",
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

    expect(typed?.type).toBe(InboxItemKind.SAVINGS_MATURITY);
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
        kind: InboxItemKind.SAVINGS_MATURITY,
        confidenceScore: 1,
        suggestedJarId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(false);
    expect(
      shouldCancelMaturityCascade({
        kind: InboxItemKind.SAVINGS_MATURITY,
        resolved: true,
      }),
    ).toBe(true);
  });
});

import {
  addSavingsTerm,
  assertCompatibleSavingsAccounts,
  calculateSettlementBreakdown,
  SavingsFamily as CanonicalSavingsFamily,
  SavingsTaxRule,
  EarlySettlementRule,
  PLATFORM_DEFAULT_TAX_RATE_PERCENT,
  getEarlyWithdrawalDefaults,
  getSavingsProductDefaults,
  savingsProductInputSchema,
} from "@/modules/savings/application/savings-domain-rules";

describe("configurable Savings domain rules", () => {
  it("enforces catalog percentage and term boundaries", () => {
    const base = {
      providerId: "11111111-1111-4111-8111-111111111111",
      name: "90 days",
      term: { amount: 90, unit: "DAY" as const },
      annualInterestRatePercent: 6.5,
      interestCalculationMethod: "simple" as const,
      taxRule: SavingsTaxRule.PROFIT_PERCENTAGE,
      taxRatePercent: 5,
      currency: "VND",
      minAmount: null,
      maxAmount: null,
      settlementRules: ["withdraw_everything"],
      earlySettlementRule: EarlySettlementRule.PRINCIPAL_ONLY,
      earlySettlementRatePercent: null,
      penaltyRules: [],
      renewableAvailable: true,
      supportsPartialSettlement: false,
    };
    expect(savingsProductInputSchema.safeParse(base).success).toBe(true);
    expect(
      savingsProductInputSchema.safeParse({
        ...base,
        annualInterestRatePercent: 101,
      }).success,
    ).toBe(false);
    expect(
      savingsProductInputSchema.safeParse({
        ...base,
        term: { amount: 0, unit: "DAY" },
      }).success,
    ).toBe(false);
  });

  it("derives fixed-term maturity from structured day and month terms", () => {
    expect(addSavingsTerm("2026-01-15", { amount: 30, unit: "DAY" })).toBe(
      "2026-02-14",
    );
    expect(addSavingsTerm("2026-01-15", { amount: 3, unit: "MONTH" })).toBe(
      "2026-04-15",
    );
    expect(
      minimumSavingsStartDate("2026-08-26", {
        amount: 6,
        unit: SavingsTermUnit.MONTH,
      }),
    ).toBe("2026-02-26");
  });

  it("does not tax BANK interest", () => {
    const settlement = calculateSettlementBreakdown({
      principal: 10_000_000,
      grossInterest: 500_000,
      taxRule: SavingsTaxRule.NONE,
      taxRatePercent: 0,
    });
    expect(settlement.tax).toBe(0);
    expect(settlement.netInterest).toBe(500_000);
    expect(settlement.totalCashReceived).toBe(10_500_000);
  });

  it("taxes PLATFORM interest at the configured 5 percent profit rule", () => {
    const settlement = calculateSettlementBreakdown({
      principal: 10_000_000,
      grossInterest: 500_000,
      taxRule: SavingsTaxRule.PROFIT_PERCENTAGE,
      taxRatePercent: 5,
    });
    expect(settlement.tax).toBe(25_000);
    expect(settlement.netInterest).toBe(475_000);
    expect(settlement.totalCashReceived).toBe(10_475_000);
  });

  it("keeps source and settlement accounts in the real-money eligibility set", () => {
    expect(
      assertCompatibleSavingsAccounts({
        fundingAccountType: "cash",
        settlementAccountType: "checking",
        fundingAccountId: "source",
        settlementAccountId: "destination",
      }),
    ).toEqual({ ok: true });
    expect(
      assertCompatibleSavingsAccounts({
        fundingAccountType: "credit_card",
        settlementAccountType: "checking",
        fundingAccountId: "source",
        settlementAccountId: "destination",
      }),
    ).toEqual({ ok: false, reason: "ACCOUNT_TYPE" });
    expect(
      assertCompatibleSavingsAccounts({
        fundingAccountType: "cash",
        settlementAccountType: "cash",
        fundingAccountId: "same",
        settlementAccountId: "same",
      }),
    ).toEqual({ ok: false, reason: "ACCOUNT_SAME" });
  });

  it("accepts multiple products with typed numeric terms and rate precision", () => {
    const parsed = savingsProductInputSchema.safeParse({
      providerId: "11111111-1111-4111-8111-111111111111",
      name: "Linh hoạt 90 ngày",
      term: { amount: 90, unit: "DAY" },
      annualInterestRatePercent: 4.25,
      interestCalculationMethod: "simple",
      taxRule: "PROFIT_PERCENTAGE",
      taxRatePercent: 5,
      currency: "vnd",
      minAmount: 1_000_000,
      maxAmount: null,
      settlementRules: ["withdraw_everything"],
      earlySettlementRule: "RETURN_PRINCIPAL_ONLY",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe("VND");
      expect(parsed.data.annualInterestRatePercent).toBe(4.25);
    }
    expect(CanonicalSavingsFamily.BANK).toBe("BANK");
    expect(CanonicalSavingsFamily.PLATFORM).toBe("PLATFORM");
  });
});

describe("Savings catalog defaults", () => {
  it("keeps BANK tax-free and applies the canonical PLATFORM default", () => {
    const bank = getSavingsProductDefaults(CanonicalSavingsFamily.BANK);
    const platform = getSavingsProductDefaults(CanonicalSavingsFamily.PLATFORM);
    expect(bank.taxRule).toBe(SavingsTaxRule.NONE);
    expect(bank.taxRatePercent).toBe(0);
    expect(platform.taxRule).toBe(SavingsTaxRule.PROFIT_PERCENTAGE);
    expect(platform.taxRatePercent).toBe(PLATFORM_DEFAULT_TAX_RATE_PERCENT);
  });

  it("uses a typed early-withdrawal default and requires a custom rate only when selected", () => {
    expect(getEarlyWithdrawalDefaults()).toEqual({
      earlySettlementRule: EarlySettlementRule.PRINCIPAL_ONLY,
      earlySettlementRatePercent: null,
    });
    const base = {
      providerId: "11111111-1111-4111-8111-111111111111",
      name: "Custom early rate",
      term: { amount: 90, unit: "DAY" as const },
      annualInterestRatePercent: 4.25,
      interestCalculationMethod: "simple" as const,
      taxRule: SavingsTaxRule.NONE,
      taxRatePercent: 0,
      currency: "VND",
      minAmount: null,
      maxAmount: null,
      settlementRules: ["withdraw_everything"],
      penaltyRules: [],
      renewableAvailable: true,
      supportsPartialSettlement: false,
    };
    expect(
      savingsProductInputSchema.safeParse({
        ...base,
        earlySettlementRule: EarlySettlementRule.CUSTOM_INTEREST_RATE,
      }).success,
    ).toBe(false);
    expect(
      savingsProductInputSchema.safeParse({
        ...base,
        earlySettlementRule: EarlySettlementRule.CUSTOM_INTEREST_RATE,
        earlySettlementRatePercent: 0.5,
      }).success,
    ).toBe(true);
  });
});
const makePresentationSaving = (overrides: Partial<Saving> = {}) =>
  ({
    status: SavingStatus.ACTIVE,
    savingsFamily: SavingsFamily.BANK,
    createdAt: "2026-08-01T00:00:00.000Z",
    productSnapshot: {
      packageName: "Product",
      durationDays: 30,
      annualInterestRate: 5,
      settlementRules: [SettlementRule.WITHDRAW_EVERYTHING],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
      currency: "VND",
      taxRule: SavingsTaxRule.NONE,
      taxRatePercent: 0,
    },
    latestCycle: {
      status: CycleStatus.ACTIVE,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      principal: 10_000_000,
      lockedRate: 5,
      accruedInterest: 500_000,
    },
    ...overrides,
  }) as unknown as Saving;

describe("savings presentation model", () => {
  it("selects the active cycle over newer historical cycles and sorts history newest-first", () => {
    const cycle = (overrides: Partial<SavingCycle>) =>
      ({
        id: "cycle",
        savingId: "saving",
        cycleNumber: 1,
        startDate: "2026-01-01",
        endDate: "2026-02-01",
        principal: 10_000_000,
        lockedRate: 5,
        packageSnapshot: {} as PackageSnapshot,
        accruedInterest: 0,
        settlementResult: null,
        renewalDecision: null,
        status: CycleStatus.ROLLED,
        fundingTransactionId: null,
        settlementTransactionId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        previousCycleId: null,
        nextCycleId: null,
        ...overrides,
      }) satisfies SavingCycle;
    const rolled = cycle({ cycleNumber: 3, id: "rolled" });
    const active = cycle({
      cycleNumber: 2,
      id: "active",
      status: CycleStatus.ACTIVE,
    });
    expect(selectCurrentSavingCycle([rolled, active])?.id).toBe("active");
  });

  it("sorts action-required maturity ahead of ordinary matured items", () => {
    const actionRequired = makePresentationSaving({
      status: SavingStatus.MATURED,
      maturityActionRequired: true,
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        status: CycleStatus.MATURED,
      },
    });
    const matured = makePresentationSaving({
      status: SavingStatus.MATURED,
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        status: CycleStatus.MATURED,
      },
    });
    const model = buildSavingsOverviewModel(
      [matured, actionRequired],
      "2026-08-15",
    );
    expect(model.items[0]?.actionRequired).toBe(true);
    expect(model.attentionCount).toBe(2);
    expect(
      buildSavingsDetailModel(actionRequired, "2026-08-15").canSettle,
    ).toBe(true);
  });

  it("prioritizes matured items and counts maturity attention", () => {
    const matured = makePresentationSaving({
      status: SavingStatus.MATURED,
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        status: CycleStatus.MATURED,
        endDate: "2026-08-15",
      },
    });
    const active = makePresentationSaving({
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        endDate: "2026-12-31",
      },
    });
    const model = buildSavingsOverviewModel([active, matured], "2026-08-15");
    expect(model.items[0]?.maturityState).toBe(
      MaturityPresentationState.MATURE_TODAY,
    );
    expect(model.attentionCount).toBe(1);
  });

  it("derives matured presentation from past end dates without a persisted status flip", () => {
    const pastDue = makePresentationSaving({
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        endDate: "2026-08-10",
      },
    });
    const dueToday = makePresentationSaving({
      latestCycle: {
        ...makePresentationSaving().latestCycle,
        endDate: "2026-08-15",
      },
    });
    const model = buildSavingsOverviewModel([pastDue, dueToday], "2026-08-15");
    expect(model.items.map((item) => item.maturityState)).toEqual([
      MaturityPresentationState.MATURED,
      MaturityPresentationState.MATURE_TODAY,
    ]);
    expect(model.attentionCount).toBe(2);
    expect(buildSavingsDetailModel(pastDue, "2026-08-15").canSettle).toBe(
      false,
    );
  });

  it("shows PLATFORM tax but keeps BANK tax at zero", () => {
    const platform = makePresentationSaving({
      savingsFamily: SavingsFamily.PLATFORM,
      productSnapshot: {
        ...makePresentationSaving().productSnapshot,
        taxRule: SavingsTaxRule.PROFIT_PERCENTAGE,
        taxRatePercent: 5,
      },
    });
    const platformModel = buildSavingsDetailModel(platform, "2026-08-15");
    const bankModel = buildSavingsDetailModel(
      makePresentationSaving(),
      "2026-08-15",
    );
    expect(platformModel.tax).toBe(25_000);
    expect(platformModel.netInterest).toBe(475_000);
    expect(bankModel.tax).toBe(0);
  });

  it("exposes early and partial settlement only when configured", () => {
    const unsupported = buildSavingsDetailModel(
      makePresentationSaving(),
      "2026-08-15",
    );
    const supported = buildSavingsDetailModel(
      makePresentationSaving({
        productSnapshot: {
          ...makePresentationSaving().productSnapshot,
          earlySettlementRule: "RETURN_PRINCIPAL_ONLY",
          supportsPartialSettlement: true,
        },
      }),
      "2026-08-15",
    );
    expect(unsupported.canSettleEarly).toBe(false);
    expect(unsupported.canSettlePartially).toBe(false);
    expect(supported.canSettleEarly).toBe(true);
    expect(supported.canSettlePartially).toBe(true);
  });
});
