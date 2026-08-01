import { NextResponse } from "next/server";

import { isServerFeatureEnabled } from "@/lib/config/features";
import { getDashboardTrend } from "@/lib/dashboard/trend";
import type { DashboardTrendPoint } from "@/lib/dashboard/types";
import { DEFAULT_HEALTH_WEIGHTS } from "@/lib/health/engine";
import { calculateAndPersistHealthSnapshot } from "@/lib/health/service";
import { fetchJarCommandCenter } from "@/lib/jars/intent";
import {
  buildSavingsListItems,
  buildSavingsSummary,
  fetchSavingsBundle,
} from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";

import { getHouseholdId, monthRange, toErrorMessage, type HealthSnapshotRow } from "../_shared";

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

    let householdId: string | null = null;
    try {
      householdId = await getHouseholdId(supabase, user.id);
    } catch {
      // User has no household, return empty data
      const { startISO, endISO } = monthRange(asOfDate);
      const payload = {
        metrics: {
          household_id: null,
          as_of_date: asOfDate,
          month_start: startISO,
          month_end: endISO,
          total_assets: 0,
          total_liabilities: 0,
          net_worth: 0,
          monthly_income: 0,
          monthly_expense: 0,
          monthly_savings: 0,
          savings_rate: null,
          savings_gross_value: 0,
          savings_liquidation_value: 0,
          savings_locked_value: 0,
          maturing_30d_value: 0,
          savings_rate_6mo_avg: null,
          savings_rate_mom_delta: null,
          emergency_months: null,
          debt_service_ratio: null,
          tdsr_percent: null,
        },
        trend: [],
        health: null,
        pendingJarReviews: 0,
        spendingJarAlerts: [],
      };
      const response = NextResponse.json(payload, { status: 200 });
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
      return response;
    }

    const { startISO } = monthRange(asOfDate);
    const jarsEnabled = isServerFeatureEnabled("jars");
    const requestedMonths = Number.isFinite(months)
      ? Math.max(1, Math.round(months))
      : 6;

    // Fetch data for core metrics calculation
    const [
      accountsResult,
      assetsResult,
      pricesResult,
      liabilitiesResult,
      txBalanceResult,
      txMonthResult,
      trend,
      savingsBundle,
      jarCommandCenter,
      healthSnapshotResult,
    ] = await Promise.all([
      // Accounts for net worth calculation
      supabase
        .from("accounts")
        .select("id, name, opening_balance, include_in_net_worth")
        .eq("household_id", householdId!)
        .eq("is_archived", false)
        .is("deleted_at", null),
      // Assets for net worth calculation
      supabase
        .from("assets")
        .select("id, name, quantity, include_in_net_worth, is_liquid")
        .eq("household_id", householdId!)
        .eq("is_archived", false)
        .is("deleted_at", null),
      // Asset prices for valuation
      supabase
        .from("asset_price_history")
        .select("asset_id, unit_price, as_of_date")
        .eq("household_id", householdId!)
        .lte("as_of_date", asOfDate)
        .order("as_of_date", { ascending: false }),
      // Liabilities for net worth calculation
      supabase
        .from("liabilities")
        .select("id, name, current_principal_outstanding")
        .eq("household_id", householdId!)
        .eq("is_active", true)
        .eq("include_in_net_worth", true),
      // All-time balance transactions for account deltas
      supabase
        .from("transactions")
        .select(
          "account_id, counterparty_account_id, type, amount, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId!)
        .lte("transaction_date", asOfDate),
      // This-month transactions for monthly metrics
      supabase
        .from("transactions")
        .select(
          "account_id, category_id, type, amount, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId!)
        .gte("transaction_date", startISO)
        .lt("transaction_date", monthRange(asOfDate).endISO),
      // Trend data
      getDashboardTrend(supabase, householdId!, {
        months: requestedMonths,
        asOfDate,
      }),
      // Savings bundle
      fetchSavingsBundle(supabase, householdId!),
      // Jar command center
      jarsEnabled ? fetchJarCommandCenter(supabase, householdId!, startISO) : Promise.resolve(null),
      // Health snapshot
      supabase
        .from("health_score_snapshots")
        .select(
          "snapshot_month, overall_score, cashflow_score, emergency_score, debt_score, networth_score, goals_score, diversification_score, top_action, metrics_json",
        )
        .eq("household_id", householdId!)
        .lte("snapshot_month", startISO)
        .order("snapshot_month", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (
      accountsResult.error ||
      assetsResult.error ||
      pricesResult.error ||
      liabilitiesResult.error ||
      txBalanceResult.error ||
      txMonthResult.error
    ) {
      return NextResponse.json(
        {
          error:
            accountsResult.error?.message ??
            assetsResult.error?.message ??
            pricesResult.error?.message ??
            liabilitiesResult.error?.message ??
            txBalanceResult.error?.message ??
            txMonthResult.error?.message ??
            "Failed to load dashboard data.",
        },
        { status: 500 },
      );
    }

    if (healthSnapshotResult.error) {
      return NextResponse.json(
        { error: healthSnapshotResult.error.message },
        { status: 500 },
      );
    }

    // Calculate core metrics inline (replacing rpc_dashboard_core)
    const balanceTransactions = txBalanceResult.data ?? [];
    const monthTransactions = txMonthResult.data ?? [];
    const accounts = accountsResult.data ?? [];
    const assets = assetsResult.data ?? [];
    const prices = pricesResult.data ?? [];
    const liabilities = liabilitiesResult.data ?? [];

    // Build account → delta map for net-worth balances
    const accountDeltaMap = new Map<string, number>();
    for (const tx of balanceTransactions) {
      if (tx.is_non_cash) continue;
      const amount = Number(tx.amount ?? 0);
      const sourceId = tx.account_id;
      const targetId = tx.counterparty_account_id;

      if (tx.type === "income" && sourceId) {
        accountDeltaMap.set(
          sourceId,
          (accountDeltaMap.get(sourceId) ?? 0) + amount,
        );
      }

      if (tx.type === "expense" && sourceId) {
        accountDeltaMap.set(
          sourceId,
          (accountDeltaMap.get(sourceId) ?? 0) - amount,
        );
      }

      if (tx.type === "transfer") {
        if (sourceId) {
          accountDeltaMap.set(
            sourceId,
            (accountDeltaMap.get(sourceId) ?? 0) - amount,
          );
        }
        if (targetId) {
          accountDeltaMap.set(
            targetId,
            (accountDeltaMap.get(targetId) ?? 0) + amount,
          );
        }
      }
    }

    // Calculate latest prices map
    const latestPriceMap = new Map<string, number>();
    for (const p of prices) {
      if (!latestPriceMap.has(p.asset_id)) {
        latestPriceMap.set(p.asset_id, Number(p.unit_price));
      }
    }

    // Calculate account assets
    let accountAssets = 0;
    for (const acc of accounts) {
      if (acc.include_in_net_worth) {
        accountAssets += Number(acc.opening_balance) + (accountDeltaMap.get(acc.id) ?? 0);
      }
    }

    // Calculate non-account assets
    let nonAccountAssets = 0;
    for (const asset of assets) {
      if (asset.include_in_net_worth) {
        const price = latestPriceMap.get(asset.id) ?? 0;
        nonAccountAssets += Number(asset.quantity) * price;
      }
    }

    const totalAssets = accountAssets + nonAccountAssets;

    // Calculate total liabilities
    const totalLiabilities = liabilities.reduce(
      (sum, l) => sum + Number(l.current_principal_outstanding),
      0,
    );

    // Calculate monthly income and expense (excluding savings transactions)
    const monthlyIncome = monthTransactions
      .filter(
        (tx) =>
          !tx.is_non_cash &&
          tx.type === "income" &&
          tx.transaction_subtype !== "savings_principal_withdrawal",
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const monthlyExpense = monthTransactions
      .filter(
        (tx) =>
          !tx.is_non_cash &&
          tx.type === "expense" &&
          tx.transaction_subtype !== "savings_principal_deposit",
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : null;

    // Build savings summary
    const savingsItems = buildSavingsListItems(
      savingsBundle.accounts,
      savingsBundle.withdrawals,
      savingsBundle.goals,
      asOfDate,
    );
    const savingsSummary = buildSavingsSummary(savingsItems);

    // Normalize health snapshot
    const healthSnapshot =
      (healthSnapshotResult.data as HealthSnapshotRow | null) ??
      (await calculateAndPersistHealthSnapshot(supabase, householdId!, asOfDate));

    const normalizedHealth =
      "snapshotMonth" in healthSnapshot
        ? healthSnapshot
        : {
            snapshotMonth: healthSnapshot.snapshot_month,
            overallScore: Number(healthSnapshot.overall_score),
            factorScores: {
              cashflow: Number(healthSnapshot.cashflow_score),
              emergency: Number(healthSnapshot.emergency_score),
              debt: Number(healthSnapshot.debt_score),
              networth: Number(healthSnapshot.networth_score),
              goals: Number(healthSnapshot.goals_score),
              diversification: Number(healthSnapshot.diversification_score),
            },
            weights:
              (healthSnapshot.metrics_json?.weights as {
                cashflow: number;
                emergency: number;
                debt: number;
                networth: number;
                goals: number;
                diversification: number;
              } | undefined) ?? DEFAULT_HEALTH_WEIGHTS,
            topAction: healthSnapshot.top_action,
            metrics:
              (healthSnapshot.metrics_json as Record<string, number | null>) ?? {},
          };

    // Build jar alerts if enabled
    type JarAlert = {
      jarId: string;
      jarName: string;
      usagePercent: number;
      alertLevel: "exceeded" | "warning";
      spent: number;
      limit: number;
    };

    const jarAlertRows: JarAlert[] = jarCommandCenter?.items
      .filter((item) => item.monthlyTarget > 0)
      .flatMap<JarAlert>((item) => {
        if (item.monthOutflow > item.monthlyTarget) {
          return [{
            jarId: item.id,
            jarName: item.name,
            usagePercent: (item.monthOutflow / item.monthlyTarget) * 100,
            alertLevel: "exceeded",
            spent: item.monthOutflow,
            limit: item.monthlyTarget,
          }];
        }
        if (item.monthInflow < item.monthlyTarget) {
          return [{
            jarId: item.id,
            jarName: item.name,
            usagePercent: (item.monthInflow / item.monthlyTarget) * 100,
            alertLevel: "warning",
            spent: item.monthInflow,
            limit: item.monthlyTarget,
          }];
        }
        return [];
      })
      .sort((a, b) => (b.usagePercent ?? 0) - (a.usagePercent ?? 0)) ?? [];

    // Adjust core metrics with savings data
    const adjustedTotalAssets = totalAssets + savingsSummary.totalGrossValue;
    const adjustedNetWorth = adjustedTotalAssets - totalLiabilities;

    const payload = {
      metrics: {
        household_id: householdId,
        as_of_date: asOfDate,
        month_start: startISO,
        month_end: monthRange(asOfDate).endISO,
        total_assets: adjustedTotalAssets,
        total_liabilities: totalLiabilities,
        net_worth: adjustedNetWorth,
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        monthly_savings: monthlySavings,
        savings_rate: savingsRate,
        savings_gross_value: savingsSummary.totalGrossValue,
        savings_liquidation_value: savingsSummary.totalLiquidationValue,
        savings_locked_value:
          savingsSummary.totalGrossValue - savingsSummary.totalLiquidationValue,
        maturing_30d_value: savingsItems
          .filter((item) => item.daysUntilMaturity !== null && item.daysUntilMaturity <= 30)
          .reduce((sum, item) => sum + item.currentValue.grossValue, 0),
        savings_rate_6mo_avg: null,
        savings_rate_mom_delta: null,
        emergency_months: null,
        debt_service_ratio: null,
        tdsr_percent: null,
      },
      trend: (trend as DashboardTrendPoint[]).slice(),
      health: normalizedHealth,
      pendingJarReviews: jarCommandCenter?.summary.pendingReviews ?? 0,
      spendingJarAlerts: jarsEnabled ? jarAlertRows : [],
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
