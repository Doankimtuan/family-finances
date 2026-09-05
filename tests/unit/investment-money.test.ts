import { describe, expect, it } from "vitest";
import {
  convertInvestmentInputUnitPriceToVnd,
  convertInvestmentInputValueToVnd,
  isInvestmentInputRateFresh,
  multiplyInvestmentInputQuantityByUnitPrice,
} from "@/modules/investments/application/investment-money";

describe("Investment input currency money", () => {
  it("converts stablecoin values and rounds canonical VND safely", () => {
    expect(convertInvestmentInputValueToVnd(12.34567891, 25_000)).toBe(308_642);
    expect(convertInvestmentInputUnitPriceToVnd(0.12345678, 25_000)).toBe(
      3086.4195,
    );
    expect(convertInvestmentInputValueToVnd(100, 1)).toBe(100);
    expect(multiplyInvestmentInputQuantityByUnitPrice("0.333", 2.5)).toBe(
      0.8325,
    );
  });

  it("treats missing, old, and recent rates differently", () => {
    const now = new Date("2026-09-05T12:00:00.000Z");
    expect(isInvestmentInputRateFresh(null, now)).toBe(false);
    expect(isInvestmentInputRateFresh("2026-09-04T11:59:59.000Z", now)).toBe(
      false,
    );
    expect(isInvestmentInputRateFresh("2026-09-05T11:59:59.000Z", now)).toBe(
      true,
    );
  });
});
