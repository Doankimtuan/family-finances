import { formatNumber } from "./formatters";

/**
 * Strip grouping/currency junk to digits, then parse a non-negative integer.
 * Empty / non-digit input → `null`.
 */
export function parseAmountDigits(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  if (value > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
  return value;
}

/**
 * Format a whole-unit amount for display in an input
 * (`vi` → `1.000.000`, `en` → `1,000,000`).
 */
export function formatAmountInput(value: number, locale?: string): string {
  if (!Number.isFinite(value)) return "";
  return formatNumber(Math.trunc(Math.abs(value)), locale, {
    maximumFractionDigits: 0,
  });
}
