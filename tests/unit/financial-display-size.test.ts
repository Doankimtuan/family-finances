import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AmountSize,
  BalanceSize,
  FinancialDisplaySize,
  FINANCIAL_DISPLAY_SIZE_CLASS,
} from "@/shared/patterns/financial-display-size";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Financial display size contract (B12)", () => {
  it("keeps size tokens on a server-safe module", () => {
    const source = readProjectFile("shared/patterns/financial-display-size.ts");

    expect(source).not.toContain("use client");
    expect(typeof BalanceSize.HERO).toBe("string");
    expect(BalanceSize.HERO).toBe(FinancialDisplaySize.HERO);
    expect(AmountSize.HERO).toBe(FinancialDisplaySize.HERO);
    expect(BalanceSize).toBe(FinancialDisplaySize);
  });

  it("maps hero size to the 36px typography token", () => {
    expect(FINANCIAL_DISPLAY_SIZE_CLASS[FinancialDisplaySize.HERO]).toBe(
      "text-4xl leading-none",
    );
    expect(FINANCIAL_DISPLAY_SIZE_CLASS[FinancialDisplaySize.LG]).toBe(
      "text-3xl",
    );
  });

  it("does not import BalanceSize from the client Balance module in RSC parents", () => {
    const serverParents = [
      "app/[locale]/(product)/money/money-position-hero.tsx",
      "shared/patterns/financial-account-hero.tsx",
      "modules/ledger/ui/account-card.tsx",
    ];

    for (const relativePath of serverParents) {
      const source = readProjectFile(relativePath);
      expect(source).toContain("financial-display-size");
      expect(source).not.toMatch(
        /import\s*\{[^}]*\bBalanceSize\b[^}]*\}\s*from\s*["'][^"']*balance["']/,
      );
    }
  });
});
