import { isAppLocale, routing, type AppLocale } from "@/i18n/locales";

/**
 * JS `Date#getUTCDay()` index of the first calendar column.
 * Presentation-only — recurring `dayOfWeek` remains Sunday = 0.
 */
export const WeekStartDay = {
  SUNDAY: 0,
  MONDAY: 1,
} as const;

export type WeekStartDay = (typeof WeekStartDay)[keyof typeof WeekStartDay];

/**
 * Calendar week start follows the app locale's Intl mapping:
 * `en` → en-US (Sunday), `vi` → vi-VN (Monday).
 */
export const WEEK_START_DAY_BY_LOCALE: Record<AppLocale, WeekStartDay> = {
  en: WeekStartDay.SUNDAY,
  vi: WeekStartDay.MONDAY,
};

export const WeekdayKey = {
  SUN: "sun",
  MON: "mon",
  TUE: "tue",
  WED: "wed",
  THU: "thu",
  FRI: "fri",
  SAT: "sat",
} as const;

export type WeekdayKey = (typeof WeekdayKey)[keyof typeof WeekdayKey];

/** Sunday-first order matching `Date#getUTCDay()`. */
export const WEEKDAY_KEYS_BY_UTC_DAY = [
  WeekdayKey.SUN,
  WeekdayKey.MON,
  WeekdayKey.TUE,
  WeekdayKey.WED,
  WeekdayKey.THU,
  WeekdayKey.FRI,
  WeekdayKey.SAT,
] as const;

export const WEEK_DAY_COUNT = WEEKDAY_KEYS_BY_UTC_DAY.length;

export function weekStartDayForLocale(locale: string): WeekStartDay {
  if (isAppLocale(locale)) return WEEK_START_DAY_BY_LOCALE[locale];
  return WEEK_START_DAY_BY_LOCALE[routing.defaultLocale];
}

export function orderedWeekdayKeys(locale: string): WeekdayKey[] {
  const start = weekStartDayForLocale(locale);
  return [
    ...WEEKDAY_KEYS_BY_UTC_DAY.slice(start),
    ...WEEKDAY_KEYS_BY_UTC_DAY.slice(0, start),
  ];
}

export function leadingEmptyDayCount(
  utcDay: number,
  weekStartDay: WeekStartDay,
): number {
  return (utcDay - weekStartDay + WEEK_DAY_COUNT) % WEEK_DAY_COUNT;
}
