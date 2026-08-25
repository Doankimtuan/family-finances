import { describe, expect, it } from "vitest";
import {
  AccountType,
  isCashSourceAccountType,
  isEligibleInvestmentCashAccount,
} from "@/modules/ledger/application/client";
import { isEligibleSavingsAccountType } from "@/modules/savings/application/savings-domain-rules";

describe("shared account eligibility", () => {
  it.each([
    AccountType.CASH,
    AccountType.CHECKING,
    AccountType.SAVINGS,
    AccountType.EWALLET,
    AccountType.OTHER,
  ])("accepts %s as an ordinary cash source", (type) => {
    expect(isCashSourceAccountType(type)).toBe(true);
    expect(isEligibleSavingsAccountType(type)).toBe(true);
  });

  it.each([
    AccountType.CREDIT_CARD,
    AccountType.BROKERAGE,
    AccountType.SAVINGS_PRODUCT,
  ])("rejects %s as an ordinary cash source", (type) => {
    expect(isCashSourceAccountType(type)).toBe(false);
    expect(isEligibleSavingsAccountType(type)).toBe(false);
  });

  it("keeps investment picker eligibility aligned with the investment RPC", () => {
    expect(
      isEligibleInvestmentCashAccount({
        type: AccountType.CASH,
        isArchived: false,
        canMutate: true,
      }),
    ).toBe(true);
    expect(
      isEligibleInvestmentCashAccount({
        type: AccountType.BROKERAGE,
        isArchived: false,
        canMutate: true,
      }),
    ).toBe(true);

    for (const type of [AccountType.CREDIT_CARD, AccountType.SAVINGS_PRODUCT]) {
      expect(
        isEligibleInvestmentCashAccount({
          type,
          isArchived: false,
          canMutate: true,
        }),
      ).toBe(false);
    }

    expect(
      isEligibleInvestmentCashAccount({
        type: AccountType.CASH,
        isArchived: true,
        canMutate: true,
      }),
    ).toBe(false);
    expect(
      isEligibleInvestmentCashAccount({
        type: AccountType.CASH,
        isArchived: false,
        canMutate: false,
      }),
    ).toBe(false);
  });
});
