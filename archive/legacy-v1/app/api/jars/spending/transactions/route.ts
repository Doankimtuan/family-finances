import { NextResponse } from "next/server";

import type { SpendingJarTxnRow } from "@/lib/jars/spending";

import { parseMonthInput, resolveApiHouseholdContext } from "../_lib/context";

export async function GET(request: Request) {
  const ctx = await resolveApiHouseholdContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { searchParams } = new URL(request.url);
  const jarId = searchParams.get("jarId");
  const month = parseMonthInput(searchParams.get("month"));
  const limitRaw = Number(searchParams.get("limit") ?? "50");
  const offsetRaw = Number(searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(200, Math.round(limitRaw)))
    : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.round(offsetRaw)) : 0;

  if (!jarId) {
    return NextResponse.json({ error: "jarId is required" }, { status: 400 });
  }

  const result = await ctx.value.supabase.rpc("rpc_spending_jar_month_transactions", {
    p_household_id: ctx.value.householdId,
    p_jar_id: jarId,
    p_month: month,
    p_limit: limit,
    p_offset: offset,
  });

  if (result.error) {
    return NextResponse.json(
      { error: `Failed to load spending jar transactions: ${result.error.message}` },
      { status: 500 },
    );
  }

  const rows = ((result.data ?? []) as SpendingJarTxnRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
  }));

  return NextResponse.json({ jarId, month, limit, offset, rows }, { status: 200 });
}
