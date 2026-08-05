import { describe, expect, it } from "vitest";
import {
  RenewalPolicy,
  RenewalPreference,
  RenewalSuggestedAction,
  SettlementRule,
  RecommendationReasonCode,
  MaturityWarningCode,
  MATURITY_CASCADE_DAY_VALUES,
} from "@/modules/savings/application/savings-constants";
import {
  mapLegacyRenewalPreference,
  suggestedActionForPolicy,
  renewalConfidenceForPolicy,
  nextRenewalPolicyAfterRenew,
  defaultRenewalConfigForLegacyPreference,
} from "@/modules/savings/application/renewal-policy-map";
import { recommendPackages } from "@/modules/savings/application/savings-recommendation";
import type { SavingPackage } from "@/modules/savings/application/savings-types";
import { instantiateTypedReviewItem } from "@/modules/inbox/application/review-item-schemas";
import {
  InboxItemKind,
  ReviewItemType,
} from "@/modules/inbox/application/inbox-constants";
import { shouldAutoResolveInboxItem } from "@/modules/inbox/application/inbox-resolution-policy";

const catalog: SavingPackage[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    providerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    packageName: "90 Days",
    durationDays: 90,
    annualInterestRate: 4.5,
    settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
    penaltyRules: [],
    renewableAvailable: true,
    minAmount: null,
    maxAmount: null,
    isActive: true,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    providerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    packageName: "180 Days",
    durationDays: 180,
    annualInterestRate: 5.5,
    settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
    penaltyRules: [],
    renewableAvailable: true,
    minAmount: null,
    maxAmount: null,
    isActive: true,
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    providerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    packageName: "30 Days",
    durationDays: 30,
    annualInterestRate: 5.0,
    settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
    penaltyRules: [],
    renewableAvailable: true,
    minAmount: null,
    maxAmount: null,
    isActive: true,
  },
];

describe("renewal policy mapping", () => {
  it("maps legacy preferences to RenewalPolicy", () => {
    expect(mapLegacyRenewalPreference(RenewalPreference.MANUAL_REVIEW)).toBe(
      RenewalPolicy.ALWAYS_ASK,
    );
    expect(
      mapLegacyRenewalPreference(RenewalPreference.AUTO_RENEW_SAME_PACKAGE),
    ).toBe(RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED);
    expect(
      mapLegacyRenewalPreference(RenewalPreference.WITHDRAW_EVERYTHING),
    ).toBe(RenewalPolicy.USE_SAVED_PREFERENCE);
    expect(mapLegacyRenewalPreference(RenewalPolicy.ONE_TIME_RENEWAL)).toBe(
      RenewalPolicy.ONE_TIME_RENEWAL,
    );
  });

  it("seeds withdraw config from legacy withdraw preference", () => {
    expect(
      defaultRenewalConfigForLegacyPreference(
        RenewalPreference.WITHDRAW_EVERYTHING,
      ).preferredSettlementRule,
    ).toBe(SettlementRule.WITHDRAW_EVERYTHING);
  });

  it("Always Ask → suggestedAction none, confidence 0", () => {
    expect(suggestedActionForPolicy(RenewalPolicy.ALWAYS_ASK, null)).toBe(
      RenewalSuggestedAction.NONE,
    );
    expect(renewalConfidenceForPolicy(RenewalPolicy.ALWAYS_ASK)).toBe(0);
  });

  it("Use Saved with withdraw → suggestedAction withdraw", () => {
    expect(
      suggestedActionForPolicy(
        RenewalPolicy.USE_SAVED_PREFERENCE,
        SettlementRule.WITHDRAW_EVERYTHING,
      ),
    ).toBe(RenewalSuggestedAction.WITHDRAW);
  });

  it("Auto Renew / One-time → confirm_configured", () => {
    expect(
      suggestedActionForPolicy(RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED, null),
    ).toBe(RenewalSuggestedAction.CONFIRM_CONFIGURED);
    expect(
      suggestedActionForPolicy(RenewalPolicy.ONE_TIME_RENEWAL, null),
    ).toBe(RenewalSuggestedAction.CONFIRM_CONFIGURED);
  });

  it("one-time renew reverts to Always Ask", () => {
    expect(nextRenewalPolicyAfterRenew(RenewalPolicy.ONE_TIME_RENEWAL)).toBe(
      RenewalPolicy.ALWAYS_ASK,
    );
    expect(
      nextRenewalPolicyAfterRenew(RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED),
    ).toBe(RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED);
  });
});

describe("package recommendation engine", () => {
  it("prefers higher rate / better liquidity; never auto-switches", () => {
    const result = recommendPackages({
      currentPackageName: "90 Days",
      currentDurationDays: 90,
      currentRate: 4.5,
      preferredPackageId: null,
      catalog,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]?.annualRate).toBeGreaterThanOrEqual(4.5);
    expect(
      result.recommendations.some(
        (r) =>
          r.reasonCode === RecommendationReasonCode.HIGHER_RETURN ||
          r.reasonCode === RecommendationReasonCode.BETTER_LIQUIDITY ||
          r.reasonCode === RecommendationReasonCode.LONGER_DURATION,
      ),
    ).toBe(true);
  });

  it("warns when preferred package is unavailable", () => {
    const result = recommendPackages({
      currentPackageName: "90 Days",
      currentDurationDays: 90,
      currentRate: 4.5,
      preferredPackageId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      catalog,
    });
    expect(result.preferredPackageActive).toBe(false);
    expect(
      result.warnings.some(
        (w) => w.code === MaturityWarningCode.PACKAGE_UNAVAILABLE,
      ),
    ).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("warns when preferred package rate changed", () => {
    const result = recommendPackages({
      currentPackageName: "90 Days",
      currentDurationDays: 90,
      currentRate: 3.0,
      preferredPackageId: catalog[0]!.id,
      catalog,
    });
    expect(
      result.warnings.some((w) => w.code === MaturityWarningCode.RATE_CHANGED),
    ).toBe(true);
  });
});

describe("maturity cascade days", () => {
  it("includes Spec BR-10 days and near-maturity escalation", () => {
    expect(MATURITY_CASCADE_DAY_VALUES).toEqual([30, 14, 7, 3, 1]);
  });
});

describe("renewal policy inbox payload", () => {
  it("hydrates suggestedAction and preselect fields", () => {
    const typed = instantiateTypedReviewItem({
      kind: InboxItemKind.SAVINGS_MATURED,
      sourceId: "11111111-1111-1111-1111-111111111111",
      contextJson: {
        savingId: "11111111-1111-1111-1111-111111111111",
        cycleId: "22222222-2222-2222-2222-222222222222",
        providerName: "Manual Saving",
        currentPackage: "90 Days",
        currentRate: 4.5,
        previousRate: null,
        rateDifference: 0,
        recommendedPackages: [
          {
            packageId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            packageName: "90 Days",
            durationDays: 90,
            annualRate: 4.5,
            reasonCode: RecommendationReasonCode.HIGHER_RETURN,
          },
        ],
        estimatedInterest: 1000,
        configuredRenewalPreference: RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
        renewalPolicy: RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
        settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
        principal: 1_000_000,
        accruedInterest: 1000,
        maturityDate: "2026-08-01",
        suggestedAction: RenewalSuggestedAction.CONFIRM_CONFIGURED,
        renewalConfidence: 0.9,
        warnings: [],
        preselectedPackageId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        preselectedSettlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
      },
    });

    expect(typed?.type).toBe(ReviewItemType.SAVINGS_MATURITY_DECISION);
    if (typed?.type === ReviewItemType.SAVINGS_MATURITY_DECISION) {
      expect(typed.payload.suggestedAction).toBe(
        RenewalSuggestedAction.CONFIRM_CONFIGURED,
      );
      expect(typed.payload.preselectedPackageId).toBe(
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      );
      expect(typed.payload.renewalPolicy).toBe(
        RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
      );
    }
  });

  it("Always Ask matured item has suggestedAction none when set", () => {
    const typed = instantiateTypedReviewItem({
      kind: InboxItemKind.SAVINGS_MATURED,
      sourceId: "11111111-1111-1111-1111-111111111111",
      contextJson: {
        savingId: "11111111-1111-1111-1111-111111111111",
        cycleId: "22222222-2222-2222-2222-222222222222",
        providerName: "Manual Saving",
        currentPackage: "90 Days",
        currentRate: 4.5,
        previousRate: null,
        rateDifference: 0,
        recommendedPackages: [],
        estimatedInterest: 0,
        configuredRenewalPreference: RenewalPolicy.ALWAYS_ASK,
        renewalPolicy: RenewalPolicy.ALWAYS_ASK,
        settlementRule: SettlementRule.WITHDRAW_EVERYTHING,
        principal: 1_000_000,
        accruedInterest: 0,
        maturityDate: "2026-08-01",
        suggestedAction: RenewalSuggestedAction.NONE,
        renewalConfidence: 0,
      },
    });
    expect(
      typed?.type === ReviewItemType.SAVINGS_MATURITY_DECISION
        ? typed.payload.suggestedAction
        : null,
    ).toBe(RenewalSuggestedAction.NONE);
  });

  it("never auto-resolves savings maturity kinds", () => {
    for (const kind of [
      InboxItemKind.SAVINGS_MATURITY,
      InboxItemKind.SAVINGS_MATURED,
      InboxItemKind.RENEWAL_REQUIRED,
    ]) {
      expect(
        shouldAutoResolveInboxItem({
          kind,
          confidenceScore: 1,
          suggestedJarId: "11111111-1111-1111-1111-111111111111",
        }),
      ).toBe(false);
    }
  });
});
