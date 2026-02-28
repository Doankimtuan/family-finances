import type { InsightFunctionType, InsightPeriod } from "./types.ts";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getZonedParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function toIsoDateUTC(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function firstDayOfMonth(year: number, month: number): string {
  return toIsoDateUTC(year, month, 1);
}

function lastDayOfMonth(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month, 0));
  return date.toISOString().slice(0, 10);
}

export function getTodayIso(timeZone: string): string {
  const { year, month, day } = getZonedParts(new Date(), timeZone);
  return toIsoDateUTC(year, month, day);
}

export function getPeriodForFunction(functionType: InsightFunctionType, timeZone: string): InsightPeriod {
  const { year, month, day } = getZonedParts(new Date(), timeZone);
  const todayIso = toIsoDateUTC(year, month, day);

  if (functionType === "monthly_review") {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    return {
      start: firstDayOfMonth(prevYear, prevMonth),
      end: lastDayOfMonth(prevYear, prevMonth),
      label: `${prevYear}-${pad2(prevMonth)}`,
    };
  }

  const weeklyStart = addDaysIso(todayIso, -6);
  return {
    start: weeklyStart,
    end: todayIso,
    label: `${weeklyStart}..${todayIso}`,
  };
}

export function getMonthBoundsForDate(isoDate: string): { monthStart: string; nextMonthStart: string } {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  const monthStart = firstDayOfMonth(year, month);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = nextMonthDate.toISOString().slice(0, 10);

  return { monthStart, nextMonthStart };
}
