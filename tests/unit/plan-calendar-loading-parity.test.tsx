import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Plan calendar loading parity (B02)", () => {
  it("mirrors the loaded calendar shell in the route loading boundary", () => {
    const loading = readProjectFile(
      "app/[locale]/(product)/plan/calendar/loading.tsx",
    );
    const view = readProjectFile(
      "app/[locale]/(product)/plan/calendar/calendar-view.tsx",
    );
    const frame = readProjectFile(
      "app/[locale]/(product)/plan/calendar/calendar-month-frame.tsx",
    );

    for (const source of [loading, view]) {
      expect(source).toContain('data-testid="plan-calendar"');
      expect(source).toContain("CalendarMonthFrame");
    }

    expect(frame).toContain('data-testid="calendar-month-nav"');
    expect(frame).toContain('data-testid="calendar-weekdays"');
    expect(frame).toContain('data-testid="calendar-grid"');
    expect(frame).toContain('data-testid="calendar-month-heading"');

    expect(loading).toContain('testId="plan-calendar-loading"');
    expect(loading).toContain("variant={TopAppBarVariant.DETAIL}");
    expect(loading).toContain("backHref={APP_PATH.PLAN}");
    expect(loading).toContain("CALENDAR_GRID_CELL_COUNT");
    expect(loading).toContain("orderedWeekdayKeys");
    expect(view).toContain('data-testid="calendar-day-');
    expect(loading.indexOf("CalendarMonthFrame")).toBeLessThan(
      loading.indexOf("calendar-cell-"),
    );
  });
});
