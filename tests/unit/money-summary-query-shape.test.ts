import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const moneyPage = readFileSync("app/[locale]/(product)/money/page.tsx", "utf8");
const savingsSummary = readFileSync(
  "modules/savings/application/queries/savings-home-summary.ts",
  "utf8",
);
const savingsMigration = readFileSync(
  "supabase/migrations/20260910210229_home_savings_summary.sql",
  "utf8",
);
const creditCardQuery = readFileSync(
  "modules/ledger/application/queries/list-credit-cards.ts",
  "utf8",
);
const creditCardMigration = readFileSync(
  "supabase/migrations/20260911055502_money_credit_card_raw_inputs.sql",
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
    expect(savingsSummary).toContain("SAVINGS_RPC.HOME_SUMMARY");
    expect(savingsSummary).not.toContain("listSavings");
    expect(savingsSummary).not.toContain("loadCycleRowsForSaving");
    expect(savingsSummary).not.toContain("saving_financial_activities");
    expect(savingsSummary).not.toContain('.from("savings")');
    expect(savingsSummary).not.toContain('.from("saving_cycles")');
    expect(savingsMigration).toContain("sc.status in ('active', 'matured')");
  });

  it("keeps Money reads independent instead of coupling them to one load flag", () => {
    expect(moneyPage).toContain("toMoneyReadState(position)");
    expect(moneyPage).toContain("toMoneyReadState(cardsListed)");
    expect(moneyPage).toContain("toMoneyReadState(savingsSummary)");
    expect(moneyPage).toContain("toMoneyReadState(investmentSummary)");
    expect(moneyPage).not.toContain("const loadFailed");
  });

  it("uses the one-wave raw credit-card read only for the Money summary", () => {
    const source = creditCardQuery.slice(
      creditCardQuery.indexOf("async function loadCreditCards"),
      creditCardQuery.indexOf("export const listCreditCards"),
    );
    expect(source).toContain("LedgerRpcName.GET_MONEY_CREDIT_CARD_RAW_INPUTS");
    expect(source).toContain("mapMoneyCreditCardRawInputs");
    expect(source).not.toContain('.from("accounts")');
    expect(source).not.toContain('.from("credit_card_settings")');
    expect(source).not.toContain('.from("card_billing_months")');
    expect(creditCardMigration).toContain("security invoker");
    expect(creditCardMigration).toContain("set search_path to 'public'");
    expect(creditCardMigration).toContain(
      "revoke all on function public.get_money_credit_card_raw_inputs() from public",
    );
    expect(creditCardMigration).toContain(
      "grant execute on function public.get_money_credit_card_raw_inputs() to authenticated",
    );
  });
});
