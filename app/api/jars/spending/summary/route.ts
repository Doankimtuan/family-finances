import { NextResponse } from "next/server";

import type { SpendingJarSummaryRow } from "@/lib/jars/spending";

import { parseMonthInput, resolveApiHouseholdContext } from "../_lib/context";

export async function GET(request: Request) {
  const ctx = await resolveApiHouseholdContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { searchParams } = new URL(request.url);
  const month = parseMonthInput(searchParams.get("month"));

  const result = await ctx.value.supabase.rpc("rpc_spending_jar_monthly_summary", {
    p_household_id: ctx.value.householdId,
    p_month: month,
  });

  if (result.error) {
    return NextResponse.json(
      { error: `Failed to load spending jar summary: ${result.error.message}` },
      { status: 500 },
    );
  }

  const rows = ((result.data ?? []) as SpendingJarSummaryRow[]).map((row) => ({
    ...row,
    monthly_limit: Number(row.monthly_limit ?? 0),
    monthly_spent: Number(row.monthly_spent ?? 0),
    usage_percent:
      row.usage_percent === null || row.usage_percent === undefined
        ? null
        : Number(row.usage_percent),
  }));

  return NextResponse.json({ month, rows }, { status: 200 });
}
