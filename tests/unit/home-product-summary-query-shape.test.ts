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
const transactionQuery = readFileSync(
  "modules/ledger/application/queries/list-transactions.ts",
  "utf8",
);
const homeDashboard = readFileSync(
  "modules/home/application/get-home-dashboard.ts",
  "utf8",
);
const homePage = readFileSync("app/[locale]/(product)/home/page.tsx", "utf8");

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

  it("keeps Home transaction reads free of display-only relations", () => {
    const source = transactionQuery.slice(
      transactionQuery.indexOf("const HOME_TRANSACTION_SELECT"),
      transactionQuery.indexOf("function mapTransactionRows"),
    );
    expect(source).toContain("categories(name)");
    expect(source).not.toContain("accounts(name, type)");
    expect(source).not.toContain("jars(name)");
    expect(source).not.toContain("transaction_tag_assignments");
  });

  it("does not wait on the enriched inbox queue for Home dashboard fields", () => {
    expect(homeDashboard).toContain("getOpenInboxAttention");
    expect(homeDashboard).not.toContain("listOpenInboxItems");
    const parallel = homeDashboard.slice(
      homeDashboard.indexOf("await Promise.all(["),
      homeDashboard.indexOf(
        "]);",
        homeDashboard.indexOf("await Promise.all(["),
      ),
    );
    expect(parallel).toContain("getOpenInboxAttention");
    expect(parallel).toContain("listTransactionsForDateRange");
  });

  it("starts savings summary in the same Home page Promise.all as the dashboard", () => {
    const parallel = homePage.slice(
      homePage.indexOf("await Promise.all(["),
      homePage.indexOf("]);", homePage.indexOf("await Promise.all([")),
    );
    expect(parallel).toContain("getHomeDashboard");
    expect(parallel).toContain("getHomeSavingsSummary");
  });
});
