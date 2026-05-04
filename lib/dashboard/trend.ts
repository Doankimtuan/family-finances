import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardTrendPoint } from "@/lib/dashboard/types";

type TrendOptions = {
  months: number;
  asOfDate: string;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStartUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthEndUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addMonthsUtc(date: Date, months: number) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function coerceNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function coerceOptionalNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTrendRow(row: DashboardTrendPoint): DashboardTrendPoint {
  return {
    household_id: row.household_id,
    month: row.month,
    net_worth: coerceNumber(row.net_worth),
    income: coerceNumber(row.income),
    expense: coerceNumber(row.expense),
    savings: coerceNumber(row.savings),
    savings_rate: coerceOptionalNumber(row.savings_rate),
    emergency_months: coerceOptionalNumber(row.emergency_months),
    debt_service_ratio: coerceOptionalNumber(row.debt_service_ratio),
  };
}

function buildMonthConfigs({ months, asOfDate }: TrendOptions) {
  const count = Math.max(1, Math.min(36, Math.round(months)));
  const asOf = new Date(`${asOfDate}T00:00:00Z`);
  const currentMonthStart = monthStartUtc(asOf);

  return Array.from({ length: count }, (_, index) => {
    const offset = index - (count - 1);
    const monthStart = addMonthsUtc(currentMonthStart, offset);
    const monthEnd = monthEndUtc(monthStart);
    const asOfForMonth = monthStart.getTime() === currentMonthStart.getTime()
      ? new Date(Math.min(asOf.getTime(), monthEnd.getTime()))
      : monthEnd;

    return {
      monthStartIso: toIsoDate(monthStart),
      asOfIso: toIsoDate(asOfForMonth),
    };
  });
}

export async function getDashboardTrend(
  supabase: SupabaseClient,
  householdId: string,
  options: TrendOptions,
): Promise<DashboardTrendPoint[]> {
  const monthConfigs = buildMonthConfigs(options);

  const trendRpc = await supabase.rpc("rpc_dashboard_monthly_trend", {
    p_household_id: householdId,
    p_months: monthConfigs.length,
  });

  if (trendRpc.error) throw new Error(trendRpc.error.message);

  const snapshotMap = new Map<string, DashboardTrendPoint>();
  for (const raw of (trendRpc.data ?? []) as DashboardTrendPoint[]) {
    const normalized = normalizeTrendRow(raw);
    snapshotMap.set(normalized.month, normalized);
  }

  // RPC now handles gaps - no fallback needed
  return monthConfigs
    .map((m) => snapshotMap.get(m.monthStartIso))
    .filter((row): row is DashboardTrendPoint => Boolean(row));
}
