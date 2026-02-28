export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

export function percentChange(current: number, baseline: number): number | null {
  const ratio = safeDivide(current - baseline, baseline);
  if (ratio === null) return null;
  return ratio * 100;
}

export function rollingAverage(values: number[]): number | null {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function trendDirection(delta: number | null): "up" | "down" | "flat" {
  if (delta === null) return "flat";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export function rankTopN<T>(items: T[], score: (item: T) => number, n: number): T[] {
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, n);
}

export function formatVnd(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${new Intl.NumberFormat("vi-VN").format(rounded)} VND`;
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(digits)}%`;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
