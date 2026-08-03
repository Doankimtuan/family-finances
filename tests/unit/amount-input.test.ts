import { describe, expect, it } from "vitest";
import {
  formatAmountInput,
  parseAmountDigits,
} from "@/shared/i18n/amount-input";

describe("parseAmountDigits", () => {
  it("returns null for empty or non-digit input", () => {
    expect(parseAmountDigits("")).toBeNull();
    expect(parseAmountDigits("abc")).toBeNull();
    expect(parseAmountDigits("...")).toBeNull();
  });

  it("strips grouping separators and parses integers", () => {
    expect(parseAmountDigits("1.000.000")).toBe(1_000_000);
    expect(parseAmountDigits("1,000,000")).toBe(1_000_000);
    expect(parseAmountDigits("250000")).toBe(250_000);
  });

  it("ignores currency symbols and spaces", () => {
    expect(parseAmountDigits("₫ 1.000.000")).toBe(1_000_000);
    expect(parseAmountDigits("$1,250")).toBe(1_250);
  });
});

describe("formatAmountInput", () => {
  it("formats with vi thousand separators", () => {
    expect(formatAmountInput(1_000_000, "vi")).toBe("1.000.000");
  });

  it("formats with en thousand separators", () => {
    expect(formatAmountInput(1_000_000, "en")).toBe("1,000,000");
  });

  it("truncates fractional parts to whole units", () => {
    expect(formatAmountInput(1_000.9, "en")).toBe("1,000");
  });

  it("returns empty for non-finite values", () => {
    expect(formatAmountInput(Number.NaN, "en")).toBe("");
  });
});
