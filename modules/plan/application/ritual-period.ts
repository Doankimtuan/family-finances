/** UTC calendar month start as YYYY-MM-01 */
export function currentPeriodMonth(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatPeriodLabel(periodMonth: string): string {
  const [y, m] = periodMonth.split("-");
  if (!y || !m) return periodMonth;
  return `${y}-${m}`;
}

/** Last calendar day of the period month (UTC), as YYYY-MM-DD. */
export function periodMonthEndDate(periodMonth: string): string {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  );
  const y = end.getUTCFullYear();
  const m = String(end.getUTCMonth() + 1).padStart(2, "0");
  const d = String(end.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Exclusive upper bound for the period (first day of next month).
 */
export function periodMonthExclusiveEnd(periodMonth: string): string {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const next = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/**
 * True when month_end + daysAfterMonthEnd ≤ today (UTC date).
 * AC-RIT-01: January unapproved on March 2 → eligible (31 Jan + 30 = 2 Mar).
 */
export function isRitualAutolockDue(
  periodMonth: string,
  daysAfterMonthEnd: number,
  now = new Date(),
): boolean {
  const monthEnd = new Date(`${periodMonthEndDate(periodMonth)}T00:00:00.000Z`);
  const due = new Date(monthEnd);
  due.setUTCDate(due.getUTCDate() + daysAfterMonthEnd);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return due.getTime() <= today;
}

export function isQuickCloseEligible(
  consecutiveCompleted: number,
  threshold: number,
): boolean {
  return consecutiveCompleted >= threshold;
}
