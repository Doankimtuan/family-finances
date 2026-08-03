/**
 * Pure credit-card billing helpers (legacy cycle math, app-layer posting).
 */

import {
  CardBillingMonthStatus,
  type CardBillingMonthStatus as CardBillingMonthStatusValue,
} from "./ledger-constants";

function clampDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(31, Math.max(1, Math.trunc(day)));
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function toUtcDateOnly(isoDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { y, m, d };
}

function formatUtcDate(y: number, m: number, d: number): string {
  const dd = Math.min(d, daysInMonth(y, m - 1));
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
}

/**
 * Billing month key = first of month. If tx day > statement_day → next month.
 */
export function resolveBillingMonthKey(
  transactionDate: string,
  statementDay: number,
): string {
  const { y, m, d } = toUtcDateOnly(transactionDate);
  const stmt = clampDay(statementDay);
  let year = y;
  let month = m;
  if (d > stmt) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return formatUtcDate(year, month, 1);
}

/**
 * Due date for a billing month: due_day in the calendar month of billing_month
 * (statement closes that month; payment due on due_day of same month when due_day
 * >= statement_day conceptually deferred — use due_day within billing month).
 * If due_day < statement_day, due is in the following month (legacy intent).
 */
export function resolveBillingDueDate(
  billingMonthKey: string,
  statementDay: number,
  dueDay: number,
): string {
  const { y, m } = toUtcDateOnly(billingMonthKey);
  const stmt = clampDay(statementDay);
  const due = clampDay(dueDay);
  let year = y;
  let month = m;
  if (due <= stmt) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return formatUtcDate(year, month, due);
}

export function computeOutstanding(
  months: Array<{
    statementAmount: number;
    paidAmount: number;
    status: string;
  }>,
): number {
  return months.reduce((sum, month) => {
    if (month.status === CardBillingMonthStatus.SETTLED) return sum;
    const remaining = month.statementAmount - month.paidAmount;
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);
}

export function computeAvailableCredit(
  creditLimit: number,
  outstanding: number,
): number {
  return Math.max(0, creditLimit - Math.max(0, outstanding));
}

export function wouldExceedCreditLimit(
  creditLimit: number,
  outstanding: number,
  expenseAmount: number,
): boolean {
  if (expenseAmount <= 0) return false;
  return outstanding + expenseAmount > creditLimit;
}

export function utilizationPercent(
  creditLimit: number,
  outstanding: number,
): number {
  if (creditLimit <= 0) return outstanding > 0 ? 100 : 0;
  return Math.min(100, Math.round((outstanding / creditLimit) * 100));
}

export type FifoMonthState = {
  id: string;
  statementAmount: number;
  paidAmount: number;
  status: CardBillingMonthStatusValue;
};

/**
 * Apply payment oldest-first across open/partial months.
 */
export function applyFifoSettlement(
  monthsOldestFirst: FifoMonthState[],
  paymentAmount: number,
): { months: FifoMonthState[]; remainingPayment: number } {
  let left = paymentAmount;
  const next = monthsOldestFirst.map((month) => {
    if (left <= 0 || month.status === CardBillingMonthStatus.SETTLED) {
      return { ...month };
    }
    const due = Math.max(0, month.statementAmount - month.paidAmount);
    if (due <= 0) {
      return {
        ...month,
        status: CardBillingMonthStatus.SETTLED,
        paidAmount: month.statementAmount,
      };
    }
    const applied = Math.min(left, due);
    left -= applied;
    const paidAmount = month.paidAmount + applied;
    const status =
      paidAmount >= month.statementAmount
        ? CardBillingMonthStatus.SETTLED
        : paidAmount > 0
          ? CardBillingMonthStatus.PARTIAL
          : CardBillingMonthStatus.OPEN;
    return { ...month, paidAmount, status };
  });
  return { months: next, remainingPayment: left };
}

export function refreshMonthStatus(
  statementAmount: number,
  paidAmount: number,
): CardBillingMonthStatusValue {
  if (statementAmount <= 0 || paidAmount >= statementAmount) {
    return CardBillingMonthStatus.SETTLED;
  }
  if (paidAmount > 0) return CardBillingMonthStatus.PARTIAL;
  return CardBillingMonthStatus.OPEN;
}
