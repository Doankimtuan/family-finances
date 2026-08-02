import { describe, expect, it } from "vitest";
import {
  SEMANTIC_COLOR_TOKENS,
  THEME_MODES,
  cssVar,
  getChartColor,
  getChartPalette,
} from "@/shared/theme";

describe("theme tokens", () => {
  it("exposes a stable semantic token catalog", () => {
    expect(SEMANTIC_COLOR_TOKENS).toContain("surface");
    expect(SEMANTIC_COLOR_TOKENS).toContain("accent");
    expect(SEMANTIC_COLOR_TOKENS).toContain("chart-series-real");
    expect(SEMANTIC_COLOR_TOKENS).toContain("health-critical");
  });

  it("builds css var references", () => {
    expect(cssVar("accent")).toBe("var(--color-accent)");
    expect(cssVar("surface-hover")).toBe("var(--color-surface-hover)");
  });

  it("supports system/light/dark modes", () => {
    expect(THEME_MODES).toEqual(["system", "light", "dark"]);
  });
});

describe("chart colors", () => {
  it("returns SSR-safe light fallbacks without document", () => {
    expect(getChartColor("chart-series-real", null)).toBe("#0f766e");
    expect(getChartColor("chart-grid", null)).toBe("#e7e5e4");
    const palette = getChartPalette(null);
    expect(palette.seriesReal).toBe("#0f766e");
    expect(palette.seriesIntention).toBe("#a8a29e");
  });
});
