import { NextResponse } from "next/server";

import type { DashboardCoreMetrics, DashboardCoreResponse, DashboardTrendPoint } from "@/lib/dashboard/types";
import { calculateAndPersistHealthSnapshot } from "@/lib/health/service";
import { createClient } from "@/lib/supabase/server";

type RpcError = {
  message: string;
};

function monthRange(asOfDate: string) {
  const date = new Date(asOfDate);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return {
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
  };
}

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
    const { startISO, endISO } = monthRange(asOfDate);

    const [coreResult, trendResult, healthResult, accountsResult, assetsResult, pricesResult, liabilitiesResult, txMonthResult, categoriesResult] = await Promise.all([
      supabase.rpc("rpc_dashboard_core", {
        p_household_id: householdId,
        p_as_of_date: asOfDate,
      }),
      supabase.rpc("rpc_dashboard_monthly_trend", {
        p_household_id: householdId,
        p_months: Number.isFinite(months) ? Math.max(1, months) : 6,
      }),
      calculateAndPersistHealthSnapshot(supabase, householdId, asOfDate).catch(() => null),
      supabase
        .from("accounts")
        .select("id, name, opening_balance")
        .eq("household_id", householdId)
        .eq("is_archived", false),
      supabase
        .from("assets")
        .select("id, name, quantity")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .eq("include_in_net_worth", true),
      supabase
        .from("asset_price_history")
        .select("asset_id, unit_price, as_of_date")
        .eq("household_id", householdId)
        .lte("as_of_date", asOfDate)
        .order("as_of_date", { ascending: false }),
      supabase
        .from("liabilities")
        .select("id, name, current_principal_outstanding")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .eq("include_in_net_worth", true),
      supabase
        .from("transactions")
        .select("account_id, category_id, type, amount")
        .eq("household_id", householdId)
        .gte("transaction_date", startISO)
        .lt("transaction_date", endISO),
      supabase
        .from("categories")
        .select("id, name")
        .or(`household_id.is.null,household_id.eq.${householdId}`),
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

    if (accountsResult.error || assetsResult.error || pricesResult.error || liabilitiesResult.error || txMonthResult.error || categoriesResult.error) {
      return NextResponse.json(
        {
          error:
            accountsResult.error?.message ??
            assetsResult.error?.message ??
            pricesResult.error?.message ??
            liabilitiesResult.error?.message ??
            txMonthResult.error?.message ??
            categoriesResult.error?.message ??
            "Failed to build dashboard drill-downs.",
        },
        { status: 500 },
      );
    }

    const transactions = txMonthResult.data ?? [];
    const accountDeltaMap = new Map<string, number>();
    for (const tx of transactions) {
      const current = accountDeltaMap.get(tx.account_id) ?? 0;
      const delta = tx.type === "income" ? Number(tx.amount) : tx.type === "expense" ? -Number(tx.amount) : 0;
      accountDeltaMap.set(tx.account_id, current + delta);
    }

    const categoryMap = new Map((categoriesResult.data ?? []).map((c) => [c.id, c.name]));

    const latestPriceMap = new Map<string, number>();
    for (const p of pricesResult.data ?? []) {
      if (!latestPriceMap.has(p.asset_id)) latestPriceMap.set(p.asset_id, Number(p.unit_price));
    }

    const assetLineItems = [
      ...(accountsResult.data ?? []).map((a) => ({
        label: a.name,
        value: Number(a.opening_balance) + (accountDeltaMap.get(a.id) ?? 0),
        source: `accounts:${a.id}+transactions(${startISO}..${endISO})`,
      })),
      ...(assetsResult.data ?? []).map((a) => ({
        label: a.name,
        value: Number(a.quantity) * (latestPriceMap.get(a.id) ?? 0),
        source: `assets:${a.id}*asset_price_history(latest<=${asOfDate})`,
      })),
    ];

    const liabilityLineItems = (liabilitiesResult.data ?? []).map((l) => ({
      label: l.name,
      value: Number(l.current_principal_outstanding),
      source: `liabilities:${l.id}`,
    }));

    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.category_id) continue;
      if (tx.type === "income") {
        incomeMap.set(tx.category_id, (incomeMap.get(tx.category_id) ?? 0) + Number(tx.amount));
      }
      if (tx.type === "expense") {
        expenseMap.set(tx.category_id, (expenseMap.get(tx.category_id) ?? 0) + Number(tx.amount));
      }
    }

    const incomeItems = Array.from(incomeMap.entries()).map(([categoryId, value]) => ({
      label: categoryMap.get(categoryId) ?? "Uncategorized income",
      value,
      source: `transactions.category:${categoryId}(${startISO}..${endISO})`,
    }));
    const expenseItems = Array.from(expenseMap.entries()).map(([categoryId, value]) => ({
      label: categoryMap.get(categoryId) ?? "Uncategorized expense",
      value,
      source: `transactions.category:${categoryId}(${startISO}..${endISO})`,
    }));

    const payload: DashboardCoreResponse = {
      metrics: ((coreResult.data as DashboardCoreMetrics[] | null) ?? [])[0] ?? null,
      trend: ((trendResult.data as DashboardTrendPoint[] | null) ?? []).slice().reverse(),
      health: healthResult,
      drilldowns: {
        netWorth: {
          assets: assetLineItems.sort((a, b) => b.value - a.value),
          liabilities: liabilityLineItems.sort((a, b) => b.value - a.value),
        },
        cashFlow: {
          income: incomeItems.sort((a, b) => b.value - a.value),
          expense: expenseItems.sort((a, b) => b.value - a.value),
          monthStart: startISO,
          monthEnd: endISO,
        },
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
