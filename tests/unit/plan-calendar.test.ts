import { describe, expect, it } from "vitest";
import {
  buildCashFlowForecast,
  mergeAndSortEvents,
  monthRange,
  payoffMilestoneDates,
  projectCardDueEvents,
  projectInstallmentEvents,
  projectLoanEvents,
  projectLiabilityEvents,
  projectRecurringEvents,
} from "@/modules/plan/application/calendar-projection";
import {
  CalendarEventSource,
  CASH_FLOW_DEFICIT_THRESHOLD,
  RecurringDirection,
  RecurringFrequency,
} from "@/modules/plan/application/plan-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { LoanStatus } from "@/modules/ledger/application/ledger-constants";

describe("monthRange", () => {
  it("builds a three-month exclusive window", () => {
    expect(monthRange("2026-08-01", 3)).toEqual({
      rangeStart: "2026-08-01",
      rangeEndExclusive: "2026-11-01",
    });
  });
});

describe("AC-CAL-01 three-domain merge", () => {
  it("merges recurring + card_due + installment with source tags", () => {
    const recurring = projectRecurringEvents(
      [
        {
          id: "r1",
          name: "Rent",
          direction: RecurringDirection.EXPENSE,
          amount: 1_200,
          frequency: RecurringFrequency.MONTHLY,
          intervalCount: 1,
          nextRunDate: "2026-08-05",
          startDate: "2026-08-05",
          isActive: true,
          currency: DEFAULT_CURRENCY,
        },
      ],
      "2026-08-01",
      "2026-09-01",
    );
    const cards = projectCardDueEvents(
      [
        {
          accountId: "c1",
          name: "Visa",
          dueDay: 15,
          statementDay: 1,
          nextDueRemaining: 500_000,
          nextDueDate: "2026-08-15",
          currency: DEFAULT_CURRENCY,
        },
      ],
      "2026-08-01",
      "2026-09-01",
    );
    const installments = projectInstallmentEvents(
      [
        {
          id: "p1",
          name: "Phone EMI",
          installmentAmount: 500_000,
          remainingInstallments: 1,
          status: LoanStatus.ACTIVE,
          currency: DEFAULT_CURRENCY,
          dueDay: 20,
        },
      ],
      "2026-08-01",
      "2026-09-01",
    );

    const events = mergeAndSortEvents([recurring, cards, installments]);
    expect(events.map((e) => e.source)).toEqual([
      CalendarEventSource.RECURRING,
      CalendarEventSource.CARD_DUE,
      CalendarEventSource.PAYOFF_MILESTONE,
    ]);
    expect(events.map((e) => e.date)).toEqual([
      "2026-08-05",
      "2026-08-15",
      "2026-08-20",
    ]);
  });
});

describe("projectRecurringEvents (AC-CAL-01 domain 1)", () => {
  it("expands monthly recurring into the window", () => {
    const events = projectRecurringEvents(
      [
        {
          id: "r1",
          name: "Rent",
          direction: RecurringDirection.EXPENSE,
          amount: 3_600_000,
          frequency: RecurringFrequency.MONTHLY,
          intervalCount: 1,
          nextRunDate: "2026-08-03",
          startDate: "2026-01-03",
          isActive: true,
          currency: DEFAULT_CURRENCY,
        },
      ],
      "2026-08-01",
      "2026-11-01",
    );
    expect(events.map((e) => e.date)).toEqual([
      "2026-08-03",
      "2026-09-03",
      "2026-10-03",
    ]);
    expect(events[0]?.source).toBe(CalendarEventSource.RECURRING);
  });
});

describe("projectCardDueEvents (AC-CAL-01 domain 2 / BR-17)", () => {
  it("uses next due remaining once — no synthetic outstanding repeats", () => {
    const events = projectCardDueEvents(
      [
        {
          accountId: "c1",
          name: "Visa",
          dueDay: 15,
          statementDay: 1,
          nextDueRemaining: 1_000_000,
          nextDueDate: "2026-08-15",
          currency: DEFAULT_CURRENCY,
        },
      ],
      "2026-08-01",
      "2026-11-01",
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.date).toBe("2026-08-15");
    expect(events[0]?.amount).toBe(1_000_000);
    expect(events[0]?.source).toBe(CalendarEventSource.CARD_DUE);
  });
});

describe("projectInstallmentEvents (AC-CAL-01 domain 3 / BR-20)", () => {
  it("marks the final remaining installment as payoff milestone on due day", () => {
    const events = projectInstallmentEvents(
      [
        {
          id: "p1",
          name: "Phone EMI",
          installmentAmount: 500_000,
          remainingInstallments: 2,
          status: LoanStatus.ACTIVE,
          currency: DEFAULT_CURRENCY,
          dueDay: 20,
        },
      ],
      "2026-08-01",
      "2026-11-01",
    );
    expect(events).toHaveLength(2);
    expect(events[0]?.isPayoffMilestone).toBe(false);
    expect(events[1]?.isPayoffMilestone).toBe(true);
    expect(events[1]?.source).toBe(CalendarEventSource.PAYOFF_MILESTONE);
    expect(payoffMilestoneDates(events)).toEqual(["2026-09-20"]);
  });
});

describe("projectLoanEvents from amortization schedule", () => {
  it("uses upcoming schedule due dates and marks final as payoff", () => {
    const events = projectLoanEvents(
      [
        {
          id: "loan-1",
          name: "Home",
          monthlyPayment: 4_000_000,
          remainingPayments: 3,
          status: LoanStatus.ACTIVE,
          currency: DEFAULT_CURRENCY,
          dueDay: 1,
          upcomingEntries: [
            { dueDate: "2026-08-05", totalDue: 4_100_000 },
            { dueDate: "2026-09-05", totalDue: 4_050_000 },
            { dueDate: "2026-10-05", totalDue: 4_000_000 },
          ],
        },
      ],
      "2026-08-01",
      "2026-11-01",
    );
    expect(events).toHaveLength(3);
    expect(events[0]?.date).toBe("2026-08-05");
    expect(events[0]?.amount).toBe(4_100_000);
    expect(events[0]?.source).toBe(CalendarEventSource.LOAN);
    expect(events[2]?.isPayoffMilestone).toBe(true);
    expect(events[2]?.source).toBe(CalendarEventSource.PAYOFF_MILESTONE);
  });
});

describe("projectLiabilityEvents", () => {
  it("emits a single balloon remaining amount — not monthly repeats", () => {
    const events = projectLiabilityEvents(
      [
        {
          id: "l1",
          name: "Family loan",
          remainingAmount: 50_000_000,
          dueDay: 10,
          currency: DEFAULT_CURRENCY,
          isArchived: false,
        },
      ],
      "2026-08-01",
      "2026-11-01",
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.date).toBe("2026-08-10");
    expect(events[0]?.amount).toBe(50_000_000);
  });
});

describe("buildCashFlowForecast (ST-E05-002)", () => {
  it("flags deficit when projected real cash falls to threshold", () => {
    const events = mergeAndSortEvents([
      projectRecurringEvents(
        [
          {
            id: "r1",
            name: "Rent",
            direction: RecurringDirection.EXPENSE,
            amount: 5_000_000,
            frequency: RecurringFrequency.MONTHLY,
            intervalCount: 1,
            nextRunDate: "2026-08-05",
            startDate: "2026-08-05",
            isActive: true,
            currency: DEFAULT_CURRENCY,
          },
        ],
        "2026-08-01",
        "2026-09-01",
      ),
    ]);
    const { deficitDates, forecast } = buildCashFlowForecast(
      1_000_000,
      events,
      CASH_FLOW_DEFICIT_THRESHOLD,
    );
    expect(deficitDates).toContain("2026-08-05");
    expect(forecast[0]?.runningBalance).toBe(-4_000_000);
  });
});

describe("calendar route constant", () => {
  it("exposes PLAN_CALENDAR under Plan IA", () => {
    expect(APP_PATH.PLAN_CALENDAR).toBe("/plan/calendar");
  });
});
