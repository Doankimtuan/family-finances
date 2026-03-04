import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ForecastRow = {
  forecast_date: string;
  opening_balance: number;
  inflow: number;
  outflow: number;
  closing_balance: number;
  risk_flag: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") ?? new Date().toISOString().slice(0, 10);
    const days = Number(searchParams.get("days") ?? "90");
    const horizonDays = Number.isFinite(days)
      ? Math.min(Math.max(Math.round(days), 1), 365)
      : 90;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membership.error || !membership.data?.household_id) {
      return NextResponse.json({ error: "No household found." }, { status: 404 });
    }

    const rpcResult = await supabase.rpc("rpc_cashflow_forecast_90d", {
      p_household_id: membership.data.household_id,
      p_start_date: startDate,
      p_days: horizonDays,
    });

    if (rpcResult.error) {
      return NextResponse.json(
        { error: `rpc_cashflow_forecast_90d failed: ${rpcResult.error.message}` },
        { status: 500 },
      );
    }

    const rows = ((rpcResult.data ?? []) as ForecastRow[]).map((row) => ({
      forecast_date: row.forecast_date,
      opening_balance: Number(row.opening_balance ?? 0),
      inflow: Number(row.inflow ?? 0),
      outflow: Number(row.outflow ?? 0),
      closing_balance: Number(row.closing_balance ?? 0),
      risk_flag: row.risk_flag,
    }));

    const firstNegativeRow =
      rows.find((row) => row.closing_balance < 0) ?? null;

    return NextResponse.json(
      {
        startDate,
        days: horizonDays,
        firstNegativeDate: firstNegativeRow?.forecast_date ?? null,
        rows,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to forecast cash flow",
      },
      { status: 500 },
    );
  }
}
