/** UTC calendar month start as YYYY-MM-01 */
export function currentPeriodMonth(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatPeriodLabel(periodMonth: string): string {
  const [y, m] = periodMonth.split("-");
  if (!y || !m) return periodMonth;
  return `${y}-${m}`;
}
