import { describe, expect, it } from "vitest";
import {
  AccountType,
  isDebtMovementAccountType,
} from "@/modules/ledger/application";

describe("Debt movement-account policy", () => {
  it.each([
    AccountType.CASH,
    AccountType.CHECKING,
    AccountType.SAVINGS,
    AccountType.EWALLET,
    AccountType.BROKERAGE,
    AccountType.OTHER,
  ])("allows liquid account type %s", (type) => {
    expect(isDebtMovementAccountType(type)).toBe(true);
  });

  it.each([AccountType.CREDIT_CARD, AccountType.SAVINGS_PRODUCT, "internal"])(
    "rejects non-liquid account type %s",
    (type) => {
      expect(isDebtMovementAccountType(type)).toBe(false);
    },
  );
});
