import { NextResponse } from "next/server";

import type { SpendingJarCategoryBreakdownRow } from "@/lib/jars/spending";

import { parseMonthInput, resolveApiHouseholdContext } from "../_lib/context";

export async function GET(request: Request) {
  const ctx = await resolveApiHouseholdContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { searchParams } = new URL(request.url);
  const jarId = searchParams.get("jarId");
  const month = parseMonthInput(searchParams.get("month"));

  if (!jarId) {
    return NextResponse.json({ error: "jarId is required" }, { status: 400 });
  }

  const result = await ctx.value.supabase.rpc(
    "rpc_spending_jar_month_category_breakdown",
    {
      p_household_id: ctx.value.householdId,
      p_jar_id: jarId,
      p_month: month,
    },
  );

  if (result.error) {
    return NextResponse.json(
      { error: `Failed to load category breakdown: ${result.error.message}` },
      { status: 500 },
    );
  }

  const rows = ((result.data ?? []) as SpendingJarCategoryBreakdownRow[]).map(
    (row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    }),
  );

  return NextResponse.json({ jarId, month, rows }, { status: 200 });
}
