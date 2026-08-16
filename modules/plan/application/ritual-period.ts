const DEFAULT_PLANNING_TIMEZONE = "Asia/Ho_Chi_Minh";
const PERIOD_MONTH_SEPARATOR = "-";
const PERIOD_MONTH_DAY = "01";

function localDateParts(
  now: Date,
  timezone: string,
): { year: string; month: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return {
    year: year ?? String(now.getUTCFullYear()),
    month: month ?? String(now.getUTCMonth() + 1).padStart(2, "0"),
  };
}

/** Household-local calendar month start as YYYY-MM-01. */
export function currentPeriodMonth(
  now = new Date(),
  timezone: string = DEFAULT_PLANNING_TIMEZONE,
): string {
  const { year, month } = localDateParts(now, timezone);
  return `${year}${PERIOD_MONTH_SEPARATOR}${month}${PERIOD_MONTH_SEPARATOR}${PERIOD_MONTH_DAY}`;
}

export function formatPeriodLabel(periodMonth: string): string {
  const [year, month] = periodMonth.split(PERIOD_MONTH_SEPARATOR);
  if (!year || !month) return periodMonth;
  return `${year}${PERIOD_MONTH_SEPARATOR}${month}`;
}

/** Last calendar day of the period month as YYYY-MM-DD. */
export function periodMonthEndDate(periodMonth: string): string {
  const start = new Date(periodMonth + "T00:00:00.000Z");
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  );
  const year = end.getUTCFullYear();
  const month = String(end.getUTCMonth() + 1).padStart(2, "0");
  const day = String(end.getUTCDate()).padStart(2, "0");
  return `${year}${PERIOD_MONTH_SEPARATOR}${month}${PERIOD_MONTH_SEPARATOR}${day}`;
}

/** Inclusive SQL date end for the period month. */
export function periodMonthExclusiveEnd(periodMonth: string): string {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const next = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${PERIOD_MONTH_SEPARATOR}${month}${PERIOD_MONTH_SEPARATOR}${PERIOD_MONTH_DAY}`;
}

/** True when month_end + daysAfterMonthEnd ≤ today in the household timezone. */
export function isRitualAutolockDue(
  periodMonth: string,
  daysAfterMonthEnd: number,
  now = new Date(),
  timezone: string = DEFAULT_PLANNING_TIMEZONE,
): boolean {
  const monthEnd = new Date(`${periodMonthEndDate(periodMonth)}T00:00:00.000Z`);
  const due = new Date(monthEnd);
  due.setUTCDate(due.getUTCDate() + daysAfterMonthEnd);
  const { year, month } = localDateParts(now, timezone);
  const day =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .find((part) => part.type === "day")?.value ?? "01";
  const today = Date.UTC(Number(year), Number(month) - 1, Number(day));
  return due.getTime() <= today;
}

export function isQuickCloseEligible(
  consecutiveCompleted: number,
  threshold: number,
): boolean {
  return consecutiveCompleted >= threshold;
}
