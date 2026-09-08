import "server-only";

import { listRecurring } from "./list-recurring";
import {
  listCreditCards,
  listLiabilities,
  listUpcomingLoanScheduleEntries,
} from "@/modules/ledger/application";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  DEFAULT_CURRENCY,
  LoanStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  PLAN_HUB_UPCOMING_DAYS,
  PLAN_HUB_UPCOMING_EVENT_LIMIT,
  PLAN_OPERATION,
} from "../plan-constants";
import { logPlanFailure } from "../plan-error";
import {
  mergeAndSortEvents,
  projectCardDueEvents,
  projectLiabilityEvents,
  projectLoanEvents,
  projectRecurringEvents,
  type CalendarEvent,
} from "../calendar-projection";

export type PlanHubUpcomingEvents = {
  householdId: string;
  currency: string;
  events: CalendarEvent[];
};

function addUtcDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

type HubLoanRow = {
  id: string;
  name: string;
  monthlyPayment: number;
  status: string;
  currency: string;
  dueDay: number;
};

async function loadHubLoans(): Promise<HubLoanRow[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("loans")
      .select("id, name, monthly_payment, due_day, currency, status")
      .eq("household_id", gate.householdId)
      .eq("status", LoanStatus.ACTIVE);
    if (error) {
      logPlanFailure(error, PLAN_OPERATION.LIST_PLAN_HUB_UPCOMING, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      monthlyPayment: Number(row.monthly_payment) || 0,
      status: row.status,
      currency: row.currency,
      dueDay: Number(row.due_day) || 1,
    }));
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.LIST_PLAN_HUB_UPCOMING, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/**
 * Plan hub upcoming preview: 7-day window, no cash-flow forecast, no
 * 3-month calendar graph, no real-position scan.
 */
export async function listPlanHubUpcomingEvents(
  now = new Date(),
): Promise<PlanHubUpcomingEvents | null> {
  const rangeStart = now.toISOString().slice(0, 10);
  const rangeEndExclusive = addUtcDays(rangeStart, PLAN_HUB_UPCOMING_DAYS + 1);

  const [recurring, cards, loans, liabilities, remainingSchedule] =
    await Promise.all([
      listRecurring(),
      listCreditCards(),
      loadHubLoans(),
      listLiabilities(),
      // Remaining upcoming rows from today, not a 7-day slice, so payoff
      // detection still compares the window to the full remaining schedule.
      listUpcomingLoanScheduleEntries(rangeStart),
    ]);

  if (
    recurring == null &&
    cards == null &&
    loans == null &&
    liabilities == null
  ) {
    return null;
  }

  const currency = recurring?.currency ?? cards?.currency ?? DEFAULT_CURRENCY;
  const householdId = recurring?.householdId ?? "";

  const scheduleByLoanId = new Map<
    string,
    Array<{ dueDate: string; totalDue: number }>
  >();
  for (const entry of remainingSchedule ?? []) {
    const list = scheduleByLoanId.get(entry.loanId) ?? [];
    list.push({ dueDate: entry.dueDate, totalDue: entry.totalDue });
    scheduleByLoanId.set(entry.loanId, list);
  }

  const events = mergeAndSortEvents([
    projectRecurringEvents(
      (recurring?.rules ?? []).map((rule) => ({
        id: rule.id,
        name: rule.name,
        direction: rule.direction,
        amount: rule.amount,
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        nextRunDate: rule.nextRunDate,
        startDate: rule.startDate,
        isActive: rule.isActive,
        currency,
      })),
      rangeStart,
      rangeEndExclusive,
    ),
    projectCardDueEvents(
      (cards?.cards ?? []).map((card) => ({
        accountId: card.accountId,
        name: card.name,
        dueDay: card.dueDay,
        statementDay: card.statementDay,
        nextDueRemaining: card.nextDueRemaining,
        nextDueDate: card.nextDueDate,
        currency,
      })),
      rangeStart,
      rangeEndExclusive,
    ),
    projectLoanEvents(
      (loans ?? []).map((loan) => {
        const upcomingEntries = scheduleByLoanId.get(loan.id);
        return {
          id: loan.id,
          name: loan.name,
          monthlyPayment: loan.monthlyPayment,
          remainingPayments: upcomingEntries?.length ?? 0,
          status: loan.status,
          currency: loan.currency || currency,
          dueDay: loan.dueDay,
          upcomingEntries,
        };
      }),
      rangeStart,
      rangeEndExclusive,
    ),
    projectLiabilityEvents(
      (liabilities ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        remainingAmount: item.remainingAmount,
        dueDay: item.dueDay,
        currency: item.currency || currency,
        isArchived: item.isArchived,
      })),
      rangeStart,
      rangeEndExclusive,
    ),
  ]).slice(0, PLAN_HUB_UPCOMING_EVENT_LIMIT);

  return {
    householdId,
    currency,
    events,
  };
}
