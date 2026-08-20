import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";

export const MILLISECONDS_PER_DAY = 86_400_000;

/** Household-local calendar date as `YYYY-MM-DD`. */
export function todayIsoDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
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
