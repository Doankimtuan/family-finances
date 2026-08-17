export const MILLISECONDS_PER_DAY = 86_400_000;

/** UTC calendar date as `YYYY-MM-DD`. */
export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** `YYYY-MM` label from an ISO date or month-start timestamp. */
export function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Signed difference between UTC calendar dates; time-of-day is ignored. */
export function differenceInUtcCalendarDays(
  from: string | Date,
  to: string | Date,
): number {
  const fromDate = typeof from === "string" ? from : from.toISOString();
  const toDate = typeof to === "string" ? to : to.toISOString();
  const fromUtc = Date.parse(`${fromDate.slice(0, 10)}T00:00:00.000Z`);
  const toUtc = Date.parse(`${toDate.slice(0, 10)}T00:00:00.000Z`);
  return Math.trunc((toUtc - fromUtc) / MILLISECONDS_PER_DAY);
}
