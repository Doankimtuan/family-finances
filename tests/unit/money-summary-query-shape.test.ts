import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const moneyPage = readFileSync("app/[locale]/(product)/money/page.tsx", "utf8");
const savingsSummary = readFileSync(
  "modules/savings/application/queries/savings-home-summary.ts",
  "utf8",
);

describe("Money summary query shape", () => {
  it("uses bounded Investment and Savings summary APIs", () => {
    expect(moneyPage).toContain("listInvestmentHomeSummary");
    expect(moneyPage).not.toContain("listInvestmentPortfolio");
    expect(moneyPage).not.toContain("countActiveInvestmentHoldings");
    expect(moneyPage).toContain("getSavingsHomeSummary");
    expect(moneyPage).not.toContain("listSavings");
  });

  it("does not retain full Savings history or per-saving fallback reads", () => {
    expect(savingsSummary).toContain(
      'in("status", [CycleStatus.ACTIVE, CycleStatus.MATURED])',
    );
    expect(savingsSummary).not.toContain("listSavings");
    expect(savingsSummary).not.toContain("loadCycleRowsForSaving");
    expect(savingsSummary).not.toContain("saving_financial_activities");
    expect(savingsSummary.match(/\.from\(/g)).toHaveLength(2);
  });

  it("keeps Money reads independent instead of coupling them to one load flag", () => {
    expect(moneyPage).toContain("toMoneyReadState(position)");
    expect(moneyPage).toContain("toMoneyReadState(cardsListed)");
    expect(moneyPage).toContain("toMoneyReadState(savingsSummary)");
    expect(moneyPage).toContain("toMoneyReadState(investmentSummary)");
    expect(moneyPage).not.toContain("const loadFailed");
  });
});
