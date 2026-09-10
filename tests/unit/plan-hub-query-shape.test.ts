import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const planPage = readFileSync("app/[locale]/(product)/plan/page.tsx", "utf8");
const upcoming = readFileSync(
  "modules/plan/application/queries/list-plan-hub-upcoming.ts",
  "utf8",
);
const goals = readFileSync(
  "modules/plan/application/queries/list-goals.ts",
  "utf8",
);
const jarBudgets = readFileSync(
  "modules/plan/application/queries/get-current-jar-budgets.ts",
  "utf8",
);
const pulse = readFileSync(
  "modules/plan/application/queries/get-plan-pulse.ts",
  "utf8",
);

describe("Plan hub query shape", () => {
  it("loads a 7-day upcoming preview instead of the full calendar graph", () => {
    expect(planPage).toContain("listPlanHubUpcomingEvents");
    expect(planPage).not.toContain("getHouseholdCalendar");
    expect(upcoming).not.toContain("getRealPosition");
    expect(upcoming).not.toContain("listLoans(");
    expect(upcoming).not.toContain("listPayoffInboxItems");
    expect(upcoming).toContain("PLAN_HUB_UPCOMING_DAYS");
    expect(upcoming).toContain("PLAN_HUB_UPCOMING_EVENT_LIMIT");
    expect(upcoming).toContain("listUpcomingLoanScheduleEntries(rangeStart)");
    expect(upcoming).not.toContain(
      "listUpcomingLoanScheduleEntries(rangeStart, rangeEndExclusive)",
    );
  });

  it("does not hydrate full loan/account/debt catalogs for goal funding", () => {
    expect(goals).not.toContain("listLoans(");
    expect(goals).not.toContain("listAccounts(");
    expect(goals).not.toContain("listDebts(");
    expect(goals).toContain("loadLinkedAccountBalances");
    expect(goals).toContain("loadLinkedLoans");
    expect(goals).toContain("loadLinkedDebts");
  });

  it("loads jar-budget dependencies in parallel after pulse and settings", () => {
    expect(jarBudgets).toContain("Promise.all");
    expect(jarBudgets).toContain("loadPeriodTransactions");
    expect(jarBudgets).toContain("loadRecurringIncome");
    expect(jarBudgets).toContain("loadSnapshots");
    expect(pulse).toContain("export const getPlanPulse = cache(loadPlanPulse)");
  });

  it("keeps Plan hub sections and CTAs in the page", () => {
    expect(planPage).toContain('testId="plan-hub"');
    expect(planPage).toContain("<PlanHubHero");
    expect(planPage).toContain("<PlanHubExceptions");
    expect(planPage).toContain('testId="plan-home-jars"');
    expect(planPage).toContain('testId="plan-home-goals"');
    expect(planPage).toContain('testId="plan-home-upcoming"');
    expect(planPage).toContain('testId="plan-home-recommendations"');
    expect(planPage).toContain("EmergencyInboxBanner");
    expect(planPage).toContain("planRecurringPath");
    expect(planPage).not.toContain("getMonthlyReview");
    expect(planPage).not.toContain("listRecurring(");
  });
});
