import { describe, expect, it } from "vitest";
import {
  FINANCIAL_SCOPE,
  isFinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import {
  normalizeCreationOwnership,
  resolveFinancialCapabilities,
} from "@/modules/shared-kernel/application/financial-ownership";

describe("Prompt 14E ownership contract", () => {
  it("accepts only the canonical household/personal scopes", () => {
    expect(isFinancialScope(FINANCIAL_SCOPE.HOUSEHOLD)).toBe(true);
    expect(isFinancialScope(FINANCIAL_SCOPE.PERSONAL)).toBe(true);
    expect(isFinancialScope("shared")).toBe(false);
    expect(isFinancialScope("partner")).toBe(false);
  });

  it("derives the caller as owner only for personal creation", () => {
    expect(
      normalizeCreationOwnership(FINANCIAL_SCOPE.PERSONAL, "member-a"),
    ).toEqual({
      financialScope: FINANCIAL_SCOPE.PERSONAL,
      ownerMembershipId: "member-a",
    });
    expect(
      normalizeCreationOwnership(FINANCIAL_SCOPE.HOUSEHOLD, "member-a"),
    ).toEqual({
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      ownerMembershipId: null,
    });
  });

  it("makes household rows mutable and partner personal rows read-only", () => {
    expect(
      resolveFinancialCapabilities(
        {
          financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
          ownerMembershipId: null,
        },
        "member-b",
      ).canMutate,
    ).toBe(true);
    expect(
      resolveFinancialCapabilities(
        {
          financialScope: FINANCIAL_SCOPE.PERSONAL,
          ownerMembershipId: "member-a",
        },
        "member-b",
      ),
    ).toMatchObject({
      isPersonal: true,
      isOwnedByMe: false,
      canMutate: false,
    });
  });
});
