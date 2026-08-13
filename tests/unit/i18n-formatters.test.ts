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
});
