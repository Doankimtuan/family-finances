/**
 * Dashboard data transformation utilities
 */

import { TDSR_HIGH_THRESHOLD, TDSR_WATCH_THRESHOLD } from "./constants";

/**
 * Converts raw savings rate month-over-month delta to percentage
 * @param savingsRateMomDelta - Raw delta value from API
 * @returns Percentage value (e.g., 0.05 -> 5.0) or null if invalid
 */
export function calculateSavingsRateDelta(
  savingsRateMomDelta: number | null,
): number | null {
  if (savingsRateMomDelta === null) return null;
  const rawValue = Number(savingsRateMomDelta);
  return Number.isFinite(rawValue) ? Number((rawValue * 100).toFixed(1)) : null;
}

/**
 * Determines debt pressure message based on TDSR value
 * @param tdsrValue - Total Debt Service Ratio percentage
 * @param t - Translation function
 * @returns Appropriate debt pressure message
 */
export function getDebtPressureNote(
  tdsrValue: number | null,
  t: (key: string) => string,
): string {
  const value = Number(tdsrValue);
  
  if (!Number.isFinite(value)) {
    return t("dashboard.metrics.debt_pressure.none");
  }
  
  if (value > TDSR_HIGH_THRESHOLD) {
    return t("dashboard.metrics.debt_pressure.high");
  }
  
  if (value >= TDSR_WATCH_THRESHOLD) {
    return t("dashboard.metrics.debt_pressure.watch");
  }
  
  return t("dashboard.metrics.debt_pressure.normal");
}

/**
 * Cleans up credit card payment title by removing prefix
 * @param title - Original title from API
 * @returns Cleaned title without "Thanh toán thẻ" prefix
 */
export function formatCreditCardTitle(title: string): string {
  return title.replace(/^Thanh toán thẻ\s*/i, "").trim();
}
