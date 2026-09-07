import {
  WEEK_DAY_COUNT,
  leadingEmptyDayCount,
  type WeekStartDay,
} from "@/shared/i18n/week-start";

/** Six week rows keep the calendar grid height stable across months. */
export const CALENDAR_WEEK_COUNT = 6;

export const CALENDAR_GRID_CELL_COUNT = WEEK_DAY_COUNT * CALENDAR_WEEK_COUNT;

export function parseAnchorMonth(anchorMonth: string): {
  year: number;
  month: number;
} {
  return {
    year: Number(anchorMonth.slice(0, 4)),
    month: Number(anchorMonth.slice(5, 7)),
  };
}

export function shiftPeriodMonth(anchorMonth: string, delta: number): string {
  const { year, month } = parseAnchorMonth(anchorMonth);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function daysInUtcMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function calendarMonthCells(
  year: number,
  month: number,
  weekStartDay: WeekStartDay,
): Array<number | null> {
  const monthIndex0 = month - 1;
  const dayCount = daysInUtcMonth(year, monthIndex0);
  const firstUtcDay = new Date(Date.UTC(year, monthIndex0, 1)).getUTCDay();
  const leading = leadingEmptyDayCount(firstUtcDay, weekStartDay);
  const cells: Array<number | null> = [];
  for (let index = 0; index < leading; index += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) cells.push(day);
  while (cells.length < CALENDAR_GRID_CELL_COUNT) cells.push(null);
  return cells;
}
