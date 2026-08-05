/**
 * Pure Household Financial Calendar projection (REQ-CAL-01).
 * Client-safe — no server imports.
 */

import {
  CalendarCashFlowSign,
  CalendarEventSource,
  CASH_FLOW_DEFICIT_THRESHOLD,
  RecurringDirection,
  RecurringFrequency,
  type CalendarCashFlowSign as CalendarCashFlowSignValue,
  type CalendarEventSource as CalendarEventSourceValue,
} from "./plan-constants";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  amount: number;
  currency: string;
  source: CalendarEventSourceValue;
  cashFlowSign: CalendarCashFlowSignValue;
  sourceId: string;
  /** True when this installment date is the final remaining payment (BR-11). */
  isPayoffMilestone: boolean;
};

export type CashFlowDayForecast = {
  date: string;
  netDelta: number;
  runningBalance: number;
  isDeficit: boolean;
};

export type CalendarProjection = {
  rangeStart: string;
  rangeEndExclusive: string;
  events: CalendarEvent[];
  deficitDates: string[];
  payoffMilestoneDates: string[];
  startingBalance: number;
  forecast: CashFlowDayForecast[];
};

function parseYmd(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function formatYmd(y: number, m: number, d: number): string {
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(d, dim);
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysUtc(iso: string, days: number): string {
  const { y, m, d } = parseYmd(iso);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function addMonthsUtc(iso: string, months: number): string {
  const { y, m, d } = parseYmd(iso);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  const dim = new Date(
    Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(d, dim);
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, day);
}

export function monthRange(
  anchorMonth: string,
  monthCount: number,
): { rangeStart: string; rangeEndExclusive: string } {
  const start = `${anchorMonth.slice(0, 7)}-01`;
  return {
    rangeStart: start,
    rangeEndExclusive: addMonthsUtc(start, monthCount),
  };
}

function inRange(
  date: string,
  rangeStart: string,
  rangeEndExclusive: string,
): boolean {
  return date >= rangeStart && date < rangeEndExclusive;
}

export type RecurringProjectionInput = {
  id: string;
  name: string;
  direction: string;
  amount: number;
  frequency: string;
  intervalCount: number;
  nextRunDate: string | null;
  startDate: string;
  isActive: boolean;
  currency: string;
};

export function projectRecurringEvents(
  rules: RecurringProjectionInput[],
  rangeStart: string,
  rangeEndExclusive: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const rule of rules) {
    if (!rule.isActive) continue;
    let cursor = rule.nextRunDate ?? rule.startDate;
    if (!cursor) continue;
    // Walk forward from next run (or start) into range
    let guard = 0;
    while (cursor < rangeStart && guard < 520) {
      cursor =
        rule.frequency === RecurringFrequency.WEEKLY
          ? addDaysUtc(cursor, 7 * Math.max(1, rule.intervalCount))
          : addMonthsUtc(cursor, Math.max(1, rule.intervalCount));
      guard += 1;
    }
    guard = 0;
    while (cursor < rangeEndExclusive && guard < 520) {
      if (inRange(cursor, rangeStart, rangeEndExclusive)) {
        const inflow = rule.direction === RecurringDirection.INCOME;
        events.push({
          id: `${CalendarEventSource.RECURRING}:${rule.id}:${cursor}`,
          date: cursor,
          title: rule.name,
          amount: rule.amount,
          currency: rule.currency,
          source: CalendarEventSource.RECURRING,
          cashFlowSign: inflow
            ? CalendarCashFlowSign.INFLOW
            : CalendarCashFlowSign.OUTFLOW,
          sourceId: rule.id,
          isPayoffMilestone: false,
        });
      }
      cursor =
        rule.frequency === RecurringFrequency.WEEKLY
          ? addDaysUtc(cursor, 7 * Math.max(1, rule.intervalCount))
          : addMonthsUtc(cursor, Math.max(1, rule.intervalCount));
      guard += 1;
    }
  }
  return events;
}

export type CardDueProjectionInput = {
  accountId: string;
  name: string;
  dueDay: number;
  statementDay: number;
  /** Remaining on the next open statement — used for concrete next due only. */
  nextDueRemaining: number;
  nextDueDate: string | null;
  currency: string;
};

/**
 * Prefer concrete nextDueDate with statement remaining.
 * Do not synthesize future months with full outstanding (false deficits).
 */
export function projectCardDueEvents(
  cards: CardDueProjectionInput[],
  rangeStart: string,
  rangeEndExclusive: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const card of cards) {
    if (
      !card.nextDueDate ||
      !inRange(card.nextDueDate, rangeStart, rangeEndExclusive)
    ) {
      continue;
    }
    const amount = Math.max(0, card.nextDueRemaining);
    if (amount <= 0) continue;
    events.push({
      id: `${CalendarEventSource.CARD_DUE}:${card.accountId}:${card.nextDueDate}`,
      date: card.nextDueDate,
      title: card.name,
      amount,
      currency: card.currency,
      source: CalendarEventSource.CARD_DUE,
      cashFlowSign: CalendarCashFlowSign.OUTFLOW,
      sourceId: card.accountId,
      isPayoffMilestone: false,
    });
  }
  return events;
}

export type LoanProjectionInput = {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingPayments: number;
  status: string;
  currency: string;
  /** Day-of-month for remaining payments (defaults to 1). */
  dueDay: number;
  /** Prefer schedule due dates when present (amortization engine). */
  upcomingEntries?: Array<{ dueDate: string; totalDue: number }>;
};

/** @deprecated Use LoanProjectionInput. */
export type InstallmentProjectionInput = {
  id: string;
  name: string;
  installmentAmount: number;
  remainingInstallments: number;
  status: string;
  currency: string;
  dueDay: number;
};

/**
 * Project remaining loan payments from schedule due dates when available;
 * otherwise fall back to monthly due-day projection. Last date is payoff milestone.
 */
export function projectLoanEvents(
  loans: LoanProjectionInput[],
  rangeStart: string,
  rangeEndExclusive: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const loan of loans) {
    if (loan.upcomingEntries && loan.upcomingEntries.length > 0) {
      const inWindow = loan.upcomingEntries.filter((entry) =>
        inRange(entry.dueDate, rangeStart, rangeEndExclusive),
      );
      for (let i = 0; i < inWindow.length; i += 1) {
        const entry = inWindow[i]!;
        const isLast =
          i === inWindow.length - 1 &&
          inWindow.length === loan.upcomingEntries.length;
        events.push({
          id: `${isLast ? CalendarEventSource.PAYOFF_MILESTONE : CalendarEventSource.LOAN}:${loan.id}:${entry.dueDate}`,
          date: entry.dueDate,
          title: loan.name,
          amount: entry.totalDue,
          currency: loan.currency,
          source: isLast
            ? CalendarEventSource.PAYOFF_MILESTONE
            : CalendarEventSource.LOAN,
          cashFlowSign: CalendarCashFlowSign.OUTFLOW,
          sourceId: loan.id,
          isPayoffMilestone: isLast,
        });
      }
      continue;
    }

    if (loan.remainingPayments <= 0) continue;
    const dueDay = Math.min(31, Math.max(1, loan.dueDay || 1));
    let monthKey = rangeStart;
    let remaining = loan.remainingPayments;
    let guard = 0;
    while (remaining > 0 && monthKey < rangeEndExclusive && guard < 120) {
      const date = formatYmd(
        parseYmd(monthKey).y,
        parseYmd(monthKey).m,
        dueDay,
      );
      if (inRange(date, rangeStart, rangeEndExclusive)) {
        const isLast = remaining === 1;
        events.push({
          id: `${isLast ? CalendarEventSource.PAYOFF_MILESTONE : CalendarEventSource.LOAN}:${loan.id}:${date}`,
          date,
          title: loan.name,
          amount: loan.monthlyPayment,
          currency: loan.currency,
          source: isLast
            ? CalendarEventSource.PAYOFF_MILESTONE
            : CalendarEventSource.LOAN,
          cashFlowSign: CalendarCashFlowSign.OUTFLOW,
          sourceId: loan.id,
          isPayoffMilestone: isLast,
        });
        remaining -= 1;
      }
      monthKey = addMonthsUtc(monthKey, 1);
      guard += 1;
    }
  }
  return events;
}

/** @deprecated Use projectLoanEvents. */
export function projectInstallmentEvents(
  plans: InstallmentProjectionInput[],
  rangeStart: string,
  rangeEndExclusive: string,
): CalendarEvent[] {
  return projectLoanEvents(
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyPayment: plan.installmentAmount,
      remainingPayments: plan.remainingInstallments,
      status: plan.status,
      currency: plan.currency,
      dueDay: plan.dueDay,
    })),
    rangeStart,
    rangeEndExclusive,
  );
}

export type LiabilityProjectionInput = {
  id: string;
  name: string;
  remainingAmount: number;
  dueDay: number | null;
  currency: string;
  isArchived: boolean;
};

/**
 * Project the next due occurrence only as a balloon remaining balance
 * (not monthly full remaining — that falsely drains cash every month).
 */
export function projectLiabilityEvents(
  liabilities: LiabilityProjectionInput[],
  rangeStart: string,
  rangeEndExclusive: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const item of liabilities) {
    if (item.isArchived || item.remainingAmount <= 0 || item.dueDay == null) {
      continue;
    }
    const dueDay = Math.min(31, Math.max(1, item.dueDay));
    let monthKey = rangeStart;
    let guard = 0;
    while (monthKey < rangeEndExclusive && guard < 36) {
      const date = formatYmd(
        parseYmd(monthKey).y,
        parseYmd(monthKey).m,
        dueDay,
      );
      if (inRange(date, rangeStart, rangeEndExclusive)) {
        events.push({
          id: `${CalendarEventSource.LIABILITY}:${item.id}:${date}`,
          date,
          title: item.name,
          amount: item.remainingAmount,
          currency: item.currency,
          source: CalendarEventSource.LIABILITY,
          cashFlowSign: CalendarCashFlowSign.OUTFLOW,
          sourceId: item.id,
          isPayoffMilestone: false,
        });
        break;
      }
      monthKey = addMonthsUtc(monthKey, 1);
      guard += 1;
    }
  }
  return events;
}

function signedDelta(event: CalendarEvent): number {
  if (event.cashFlowSign === CalendarCashFlowSign.INFLOW) return event.amount;
  if (event.cashFlowSign === CalendarCashFlowSign.OUTFLOW) return -event.amount;
  return 0;
}

/**
 * Running projected real-cash balance across event dates (ST-E05-002).
 */
export function buildCashFlowForecast(
  startingBalance: number,
  events: CalendarEvent[],
  deficitThreshold: number = CASH_FLOW_DEFICIT_THRESHOLD,
): {
  forecast: CashFlowDayForecast[];
  deficitDates: string[];
} {
  const byDate = new Map<string, number>();
  for (const event of events) {
    byDate.set(event.date, (byDate.get(event.date) ?? 0) + signedDelta(event));
  }
  const dates = [...byDate.keys()].sort();
  let running = startingBalance;
  const forecast: CashFlowDayForecast[] = [];
  const deficitDates: string[] = [];
  for (const date of dates) {
    const netDelta = byDate.get(date) ?? 0;
    running += netDelta;
    const isDeficit = running <= deficitThreshold;
    forecast.push({ date, netDelta, runningBalance: running, isDeficit });
    if (isDeficit) deficitDates.push(date);
  }
  return { forecast, deficitDates };
}

export function mergeAndSortEvents(groups: CalendarEvent[][]): CalendarEvent[] {
  const seen = new Set<string>();
  const merged: CalendarEvent[] = [];
  for (const group of groups) {
    for (const event of group) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      merged.push(event);
    }
  }
  return merged.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.title.localeCompare(b.title);
  });
}

export function payoffMilestoneDates(events: CalendarEvent[]): string[] {
  return [
    ...new Set(events.filter((e) => e.isPayoffMilestone).map((e) => e.date)),
  ].sort();
}
