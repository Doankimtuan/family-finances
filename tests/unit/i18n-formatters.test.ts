import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelativeTime,
} from "@/shared/i18n/formatters";

describe("i18n formatters", () => {
  it("formats currency for en-US and vi-VN", () => {
    const en = formatCurrency(1234.5, "USD", "en");
    const vi = formatCurrency(1234.5, "VND", "vi");
    expect(en).toMatch(/1/);
    expect(vi).toMatch(/1/);
    expect(en).not.toEqual(vi);
  });

  it("formats numbers and percents", () => {
    expect(formatNumber(1000, "en")).toMatch(/1/);
    expect(formatPercent(0.25, "en")).toMatch(/25/);
  });

  it("formats dates and relative time", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(formatDate(date, "en").length).toBeGreaterThan(0);
    expect(formatRelativeTime(-1, "day", "en").length).toBeGreaterThan(0);
  });
  it("formats compact date components without conflicting with the default style", () => {
    const date = new Date("2026-08-13T12:00:00Z");
    expect(formatDate(date, "en", { month: "short", day: "numeric" })).toMatch(
      /Aug/,
    );
  });
  it("uses Vietnamese number placement and compact day-first dates", () => {
    const vietnameseCurrency = formatCurrency(1_000, "VND", "vi");
    expect(vietnameseCurrency).toContain("₫");
    expect(vietnameseCurrency).toContain("1.000");
    expect(
      formatDate(new Date("2026-08-14T00:00:00Z"), "vi", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    ).toBe("14/08/2026");
  });
});
