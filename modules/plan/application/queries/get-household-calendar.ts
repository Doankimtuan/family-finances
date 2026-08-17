import "server-only";

import { listRecurring } from "./list-recurring";
import {
  listCreditCards,
  listLoans,
  listLiabilities,
  listUpcomingLoanScheduleEntries,
  getRealPosition,
} from "@/modules/ledger/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { LoanStatus } from "@/modules/ledger/application/ledger-constants";
import {
  InboxItemKind,
  InboxItemStatus,
} from "@/modules/inbox/application/inbox-constants";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  CALENDAR_PROJECTION_MONTHS,
  CASH_FLOW_DEFICIT_THRESHOLD,
  PLAN_OPERATION,
} from "../plan-constants";
import { currentPeriodMonth } from "../ritual-period";
import {
  buildCashFlowForecast,
  mergeAndSortEvents,
  monthRange,
  payoffMilestoneDates,
  projectCardDueEvents,
  projectLoanEvents,
  projectLiabilityEvents,
  projectRecurringEvents,
  type CalendarEvent,
  type CalendarProjection,
  type CashFlowDayForecast,
} from "../calendar-projection";
import { logPlanFailure } from "../plan-error";

export type HouseholdCalendar = CalendarProjection & {
  householdId: string;
  currency: string;
  anchorMonth: string;
  eventsByDate: Record<string, CalendarEvent[]>;
  /** Pending InstallmentComplete inbox item id by loan id (BR-11). */
  payoffInboxItemByPlanId: Record<string, string>;
};

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const list = map[event.date] ?? [];
    list.push(event);
    map[event.date] = list;
  }
  return map;
}

async function listPayoffInboxItems(
  householdId: string,
): Promise<Record<string, string>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("inbox_items")
      .select("id, source_id")
      .eq("household_id", householdId)
      .eq("kind", InboxItemKind.EMI_COMPLETE)
      .eq("status", InboxItemStatus.PENDING);
    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      if (row.source_id && row.id) {
        map[row.source_id as string] = row.id as string;
      }
    }
    return map;
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.LIST_PAYOFF_INBOX_ITEMS, {
      householdId,
    });
    return {};
  }
}

/**
 * Multi-domain Household Financial Calendar (ST-E05-001 / REQ-CAL-01).
 * Aggregates recurring + card dues + installments/liabilities under Plan.
 */
export async function getHouseholdCalendar(
  anchorMonth: string = currentPeriodMonth(),
  monthCount: number = CALENDAR_PROJECTION_MONTHS,
): Promise<HouseholdCalendar | null> {
  const { rangeStart, rangeEndExclusive } = monthRange(anchorMonth, monthCount);

  const [recurring, cards, loans, liabilities, position, upcomingSchedule] =
    await Promise.all([
      listRecurring(),
      listCreditCards(),
      listLoans(),
      listLiabilities(),
      getRealPosition(),
      listUpcomingLoanScheduleEntries(),
    ]);

  if (
    recurring == null &&
    cards == null &&
    loans == null &&
    liabilities == null &&
    position == null
  ) {
    return null;
  }

  const currency =
    recurring?.currency ??
    cards?.currency ??
    position?.currency ??
    DEFAULT_CURRENCY;

  const householdId = recurring?.householdId ?? position?.householdId ?? "";

  const scheduleByLoanId = new Map<
    string,
    Array<{ dueDate: string; totalDue: number }>
  >();
  for (const entry of upcomingSchedule ?? []) {
    const list = scheduleByLoanId.get(entry.loanId) ?? [];
    list.push({ dueDate: entry.dueDate, totalDue: entry.totalDue });
    scheduleByLoanId.set(entry.loanId, list);
  }

  const recurringEvents = projectRecurringEvents(
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
  );

  const cardEvents = projectCardDueEvents(
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
  );

  const loanEvents = projectLoanEvents(
    (loans ?? [])
      .filter((loan) => loan.status === LoanStatus.ACTIVE)
      .map((loan) => ({
        id: loan.id,
        name: loan.name,
        monthlyPayment: loan.monthlyPayment,
        remainingPayments: loan.remainingPayments,
        status: loan.status,
        currency: loan.currency || currency,
        dueDay: loan.dueDay,
        upcomingEntries: scheduleByLoanId.get(loan.id),
      })),
    rangeStart,
    rangeEndExclusive,
  );

  const liabilityEvents = projectLiabilityEvents(
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
  );

  const events = mergeAndSortEvents([
    recurringEvents,
    cardEvents,
    loanEvents,
    liabilityEvents,
  ]);

  const startingBalance = position?.totalBalance ?? 0;
  const { forecast, deficitDates } = buildCashFlowForecast(
    startingBalance,
    events,
    CASH_FLOW_DEFICIT_THRESHOLD,
  );

  const payoffInboxItemByPlanId = householdId
    ? await listPayoffInboxItems(householdId)
    : {};

  return {
    householdId,
    currency,
    anchorMonth: rangeStart,
    rangeStart,
    rangeEndExclusive,
    events,
    eventsByDate: groupByDate(events),
    deficitDates,
    payoffMilestoneDates: payoffMilestoneDates(events),
    startingBalance,
    forecast,
    payoffInboxItemByPlanId,
  };
}

export type { CalendarEvent, CashFlowDayForecast };
