import { describe, expect, it } from "vitest";
import {
  WeekStartDay,
  WeekdayKey,
  leadingEmptyDayCount,
  orderedWeekdayKeys,
  weekStartDayForLocale,
} from "@/shared/i18n/week-start";
import {
  CALENDAR_GRID_CELL_COUNT,
  calendarMonthCells,
  shiftPeriodMonth,
} from "@/app/[locale]/(product)/plan/calendar/calendar-navigation";

describe("week start presentation", () => {
  it("uses Sunday-first for EN (en-US) and Monday-first for VI (vi-VN)", () => {
    expect(weekStartDayForLocale("en")).toBe(WeekStartDay.SUNDAY);
    expect(weekStartDayForLocale("vi")).toBe(WeekStartDay.MONDAY);
    expect(orderedWeekdayKeys("en")[0]).toBe(WeekdayKey.SUN);
    expect(orderedWeekdayKeys("vi")[0]).toBe(WeekdayKey.MON);
  });

  it("pads September 2026 (Tuesday) without changing the date values", () => {
    // 2026-09-01 is Tuesday — getUTCDay() === 2.
    expect(leadingEmptyDayCount(2, WeekStartDay.SUNDAY)).toBe(2);
    expect(leadingEmptyDayCount(2, WeekStartDay.MONDAY)).toBe(1);

    const sundayFirst = calendarMonthCells(2026, 9, WeekStartDay.SUNDAY);
    const mondayFirst = calendarMonthCells(2026, 9, WeekStartDay.MONDAY);
    expect(sundayFirst).toHaveLength(CALENDAR_GRID_CELL_COUNT);
    expect(mondayFirst).toHaveLength(CALENDAR_GRID_CELL_COUNT);
    expect(sundayFirst.slice(0, 3)).toEqual([null, null, 1]);
    expect(mondayFirst.slice(0, 2)).toEqual([null, 1]);
  });
});

describe("calendar month URL stepping", () => {
  it("moves to the previous and next month starts", () => {
    expect(shiftPeriodMonth("2024-03-01", -1)).toBe("2024-02-01");
    expect(shiftPeriodMonth("2024-03-01", 1)).toBe("2024-04-01");
    expect(shiftPeriodMonth("2024-01-15", -1)).toBe("2023-12-01");
  });
});
