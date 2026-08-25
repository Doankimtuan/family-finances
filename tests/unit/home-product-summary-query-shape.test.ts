import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const investmentQuery = readFileSync(
  "modules/investments/application/queries/investment-queries.ts",
  "utf8",
);
const savingsQuery = readFileSync(
  "modules/savings/application/queries/savings-home-summary.ts",
  "utf8",
);
const homeAdapter = readFileSync(
  "modules/home/application/home-product-summary-adapters.ts",
  "utf8",
);

describe("Home product summary query shape", () => {
  it("uses the lightweight Investment summary API without lots or activity objects", () => {
    expect(homeAdapter).toContain("listInvestmentHomeSummary");
    expect(homeAdapter).not.toContain("listInvestmentPortfolio");
    const source = investmentQuery.slice(
      investmentQuery.indexOf("async function loadInvestmentHomeSummary"),
      investmentQuery.indexOf("export const listInvestmentHomeSummary"),
    );
    expect(source.match(/\.from\(/g)?.length).toBeLessThanOrEqual(6);
    expect(source).not.toContain("investment_lots");
    expect(source).not.toContain("listInvestmentActivities");
  });

  it("limits Savings reads to active or matured current-cycle candidates", () => {
    expect(homeAdapter).toContain("getSavingsHomeSummary");
    expect(savingsQuery).not.toContain("listSavings");
    expect(savingsQuery).not.toContain("saving_financial_activities");
    expect(savingsQuery).toContain(
      'in("status", [CycleStatus.ACTIVE, CycleStatus.MATURED])',
    );
    expect(savingsQuery.match(/\.from\(/g)?.length).toBe(2);
  });
});
