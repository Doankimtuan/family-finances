/**
 * Chart color helpers — read live CSS semantic tokens so Recharts
 * (and any canvas chart) always track light/dark without hardcoded hex.
 */

export type ChartToken =
  | "chart-ink"
  | "chart-grid"
  | "chart-positive"
  | "chart-negative"
  | "chart-neutral"
  | "chart-series-real"
  | "chart-series-intention";

const CSS_VAR: Record<ChartToken, string> = {
  "chart-ink": "--color-chart-ink",
  "chart-grid": "--color-chart-grid",
  "chart-positive": "--color-chart-positive",
  "chart-negative": "--color-chart-negative",
  "chart-neutral": "--color-chart-neutral",
  "chart-series-real": "--color-chart-series-real",
  "chart-series-intention": "--color-chart-series-intention",
};

/** Resolve a chart token to a concrete color string (hex/rgb). SSR-safe fallback. */
export function getChartColor(
  token: ChartToken,
  el: Element | null = typeof document !== "undefined"
    ? document.documentElement
    : null,
): string {
  if (!el || typeof getComputedStyle === "undefined") {
    // Light-mode fallbacks for SSR / tests — match :root in globals.css
    const fallback: Record<ChartToken, string> = {
      "chart-ink": "#18181b",
      "chart-grid": "#e7e5e4",
      "chart-positive": "#047857",
      "chart-negative": "#be123c",
      "chart-neutral": "#71717a",
      "chart-series-real": "#0f766e",
      "chart-series-intention": "#a8a29e",
    };
    return fallback[token];
  }
  const value = getComputedStyle(el).getPropertyValue(CSS_VAR[token]).trim();
  return value || getChartColor(token, null);
}

/** Convenience pack for Recharts series + axes */
export function getChartPalette(el?: Element | null) {
  return {
    ink: getChartColor("chart-ink", el ?? null),
    grid: getChartColor("chart-grid", el ?? null),
    positive: getChartColor("chart-positive", el ?? null),
    negative: getChartColor("chart-negative", el ?? null),
    neutral: getChartColor("chart-neutral", el ?? null),
    seriesReal: getChartColor("chart-series-real", el ?? null),
    seriesIntention: getChartColor("chart-series-intention", el ?? null),
  };
}
