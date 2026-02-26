import { NextResponse } from "next/server";

import type { DashboardCoreMetrics, DashboardCoreResponse, DashboardTrendPoint } from "@/lib/dashboard/types";
import { calculateAndPersistHealthSnapshot } from "@/lib/health/service";
import { createClient } from "@/lib/supabase/server";

type RpcError = {
  message: string;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);
    const months = Number(searchParams.get("months") ?? "6");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const householdResult = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (householdResult.error) {
      return NextResponse.json(
        { error: `Failed to resolve household: ${householdResult.error.message}` },
        { status: 500 },
      );
    }

    if (!householdResult.data?.household_id) {
      return NextResponse.json(
        { error: "No household found. Create or join a household first." },
        { status: 404 },
      );
    }

    const householdId = householdResult.data.household_id;

    const [coreResult, trendResult, healthResult] = await Promise.all([
      supabase.rpc("rpc_dashboard_core", {
        p_household_id: householdId,
        p_as_of_date: asOfDate,
      }),
      supabase.rpc("rpc_dashboard_monthly_trend", {
        p_household_id: householdId,
        p_months: Number.isFinite(months) ? Math.max(1, months) : 6,
      }),
      calculateAndPersistHealthSnapshot(supabase, householdId, asOfDate).catch(() => null),
    ]);

    if (coreResult.error) {
      const coreErr = coreResult.error as RpcError;
      return NextResponse.json(
        { error: `rpc_dashboard_core failed: ${coreErr.message}` },
        { status: 500 },
      );
    }

    if (trendResult.error) {
      const trendErr = trendResult.error as RpcError;
      return NextResponse.json(
        { error: `rpc_dashboard_monthly_trend failed: ${trendErr.message}` },
        { status: 500 },
      );
    }

    const payload: DashboardCoreResponse = {
      metrics: ((coreResult.data as DashboardCoreMetrics[] | null) ?? [])[0] ?? null,
      trend: ((trendResult.data as DashboardTrendPoint[] | null) ?? []).slice().reverse(),
      health: healthResult,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
