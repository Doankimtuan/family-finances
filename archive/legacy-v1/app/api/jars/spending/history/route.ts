import { NextResponse } from "next/server";

import type { SpendingJarHistoryRow } from "@/lib/jars/spending";

import { resolveApiHouseholdContext } from "../_lib/context";

export async function GET(request: Request) {
  const ctx = await resolveApiHouseholdContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { searchParams } = new URL(request.url);
  const jarId = searchParams.get("jarId");
  const monthsRaw = Number(searchParams.get("months") ?? "12");
  const months = Number.isFinite(monthsRaw)
    ? Math.max(1, Math.min(24, Math.round(monthsRaw)))
    : 12;

  if (!jarId) {
    return NextResponse.json({ error: "jarId is required" }, { status: 400 });
  }

  const result = await ctx.value.supabase.rpc("rpc_spending_jar_history_months", {
    p_household_id: ctx.value.householdId,
    p_jar_id: jarId,
    p_months: months,
  });

  if (result.error) {
    return NextResponse.json(
      { error: `Failed to load spending jar history: ${result.error.message}` },
      { status: 500 },
    );
  }

  const rows = ((result.data ?? []) as SpendingJarHistoryRow[]).map((row) => ({
    ...row,
    monthly_limit: Number(row.monthly_limit ?? 0),
    monthly_spent: Number(row.monthly_spent ?? 0),
    usage_percent:
      row.usage_percent === null || row.usage_percent === undefined
        ? null
        : Number(row.usage_percent),
  }));

  return NextResponse.json({ jarId, months, rows }, { status: 200 });
}
