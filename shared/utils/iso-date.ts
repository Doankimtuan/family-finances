/** UTC calendar date as `YYYY-MM-DD`. */
export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** `YYYY-MM` label from an ISO date or month-start timestamp. */
export function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}
