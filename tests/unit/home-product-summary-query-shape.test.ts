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
const homeStreamingSections = readFileSync(
  "app/[locale]/(product)/home/home-streaming-sections.tsx",
  "utf8",
);
const savingsMigration = readFileSync(
  "supabase/migrations/20260910210229_home_savings_summary.sql",
  "utf8",
);
const investmentMigration = readFileSync(
  "supabase/migrations/20260911022939_home_investment_raw_inputs.sql",
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
    expect(source).toContain("INVESTMENT_QUERY_RPC.HOME_RAW_INPUTS");
    expect(source).toContain("resolveInvestmentValuation");
    expect(source).not.toContain('.from("investment_holdings")');
    expect(source).not.toContain("investment_lots");
    expect(source).not.toContain("listInvestmentActivities");
    expect(investmentMigration).toContain("security invoker");
    expect(investmentMigration).toContain("set search_path to 'public'");
    expect(investmentMigration).toContain(
      "revoke all on function public.get_home_investment_raw_inputs() from public",
    );
    expect(investmentMigration).toContain(
      "grant execute on function public.get_home_investment_raw_inputs() to authenticated",
    );
  });

  it("collapses Savings current-cycle reads into the narrow Home RPC", () => {
    expect(homeAdapter).toContain("getSavingsHomeSummary");
    expect(savingsQuery).not.toContain("listSavings");
    expect(savingsQuery).not.toContain("saving_financial_activities");
    expect(savingsQuery).toContain("SAVINGS_RPC.HOME_SUMMARY");
    expect(savingsQuery).not.toContain('.from("savings")');
    expect(savingsQuery).not.toContain('.from("saving_cycles")');
    expect(savingsMigration).toContain("security invoker");
    expect(savingsMigration).toContain("set search_path to 'public'");
    expect(savingsMigration).toContain(
      "revoke all on function public.get_home_savings_summary() from public",
    );
    expect(savingsMigration).toContain(
      "grant execute on function public.get_home_savings_summary() to authenticated",
    );
    expect(savingsMigration).toContain("sc.status in ('active', 'matured')");
    expect(savingsMigration).toContain(
      "s.status not in ('closed', 'early_closed')",
    );
    expect(savingsMigration).toContain(
      "case when sc.status = 'active' then 0 else 1 end",
    );
    expect(savingsMigration).toContain("distinct on (sc.saving_id)");
    expect(savingsMigration).toContain(
      "sum(principal) filter (where status = 'active')",
    );
    expect(savingsMigration).toContain(
      "min(end_date) filter (where status = 'active')",
    );
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
    expect(homeDashboard).toContain("getOpenInboxAttention");
    expect(homeDashboard).toContain("getHomePeriodData(period)");
    expect(homeDashboard).toContain("listTransactionsForDateRange");
  });

  it("starts independent Home section promises after readiness", () => {
    expect(homePage).toContain("getHomeReadiness");
    expect(homeStreamingSections).toContain("getHomeSavingsSummary");
    expect(homeStreamingSections).toContain("getHomeInvestmentSummary");
    expect(homeStreamingSections).toContain("getHomePeriodData(period)");
    expect(homeStreamingSections).toContain("<Suspense");
  });
});
