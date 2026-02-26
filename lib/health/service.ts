import type { SupabaseClient } from "@supabase/supabase-js";

import { computeFinancialHealth } from "@/lib/health/engine";

type DashboardCoreRow = {
  total_assets: number;
  total_liabilities: number;
  monthly_savings: number;
  savings_rate: number | null;
  emergency_months: number | null;
  debt_service_ratio: number | null;
};

type TrendRow = { net_worth: number };

type GoalRow = {
  id: string;
  target_amount: number;
  target_date: string | null;
};

type GoalContributionRow = {
  goal_id: string;
  amount: number;
  contribution_date: string;
};

type AssetRow = {
  id: string;
  asset_class: string;
  quantity: number;
};

type AssetPriceRow = {
  asset_id: string;
  unit_price: number;
};

function firstOfCurrentMonthISO() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function monthDiff(now: Date, target: Date) {
  return (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + (target.getUTCMonth() - now.getUTCMonth());
}

export async function calculateAndPersistHealthSnapshot(
  supabase: SupabaseClient,
  householdId: string,
  asOfDate: string,
) {
  const [coreResult, trendResult, goalsResult, assetsResult] = await Promise.all([
    supabase.rpc("rpc_dashboard_core", { p_household_id: householdId, p_as_of_date: asOfDate }),
    supabase.rpc("rpc_dashboard_monthly_trend", { p_household_id: householdId, p_months: 6 }),
    supabase
      .from("goals")
      .select("id, target_amount, target_date")
      .eq("household_id", householdId)
      .eq("status", "active"),
    supabase
      .from("assets")
      .select("id, asset_class, quantity")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .eq("include_in_net_worth", true),
  ]);

  if (coreResult.error) throw new Error(coreResult.error.message);
  if (trendResult.error) throw new Error(trendResult.error.message);
  if (goalsResult.error) throw new Error(goalsResult.error.message);
  if (assetsResult.error) throw new Error(assetsResult.error.message);

  const core = ((coreResult.data ?? []) as DashboardCoreRow[])[0] ?? null;
  if (!core) {
    throw new Error("Missing dashboard core metrics for health calculation.");
  }

  const trend = ((trendResult.data ?? []) as TrendRow[]).map((row) => Number(row.net_worth));
  const goals = (goalsResult.data ?? []) as GoalRow[];

  const goalIds = goals.map((goal) => goal.id);
  const contributionsResult = goalIds.length
    ? await supabase
        .from("goal_contributions")
        .select("goal_id, amount, contribution_date")
        .eq("household_id", householdId)
        .in("goal_id", goalIds)
    : { data: [], error: null };

  if (contributionsResult.error) throw new Error(contributionsResult.error.message);

  const contributions = (contributionsResult.data ?? []) as GoalContributionRow[];
  const contributionMap = new Map<string, GoalContributionRow[]>();

  for (const contribution of contributions) {
    const existing = contributionMap.get(contribution.goal_id) ?? [];
    existing.push(contribution);
    contributionMap.set(contribution.goal_id, existing);
  }

  const today = new Date();
  const sixMonthAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 6, 1));

  const goalProgressRatios: number[] = [];
  const goalOnTrackValues: number[] = [];

  for (const goal of goals) {
    const rows = contributionMap.get(goal.id) ?? [];
    const funded = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const progress = goal.target_amount > 0 ? Math.max(0, Math.min(1, funded / Number(goal.target_amount))) : 0;
    goalProgressRatios.push(progress);

    if (goal.target_date) {
      const monthsLeft = Math.max(1, monthDiff(today, new Date(goal.target_date)));
      const remaining = Math.max(0, Number(goal.target_amount) - funded);
      const requiredMonthly = remaining / monthsLeft;
      const monthlyAvg = rows
        .filter((row) => new Date(row.contribution_date) >= sixMonthAgo)
        .reduce((sum, row) => sum + Number(row.amount), 0) / 6;
      goalOnTrackValues.push(monthlyAvg >= requiredMonthly ? 1 : 0);
    }
  }

  const assets = (assetsResult.data ?? []) as AssetRow[];
  const assetIds = assets.map((asset) => asset.id);

  const pricesResult = assetIds.length
    ? await supabase
        .from("asset_price_history")
        .select("asset_id, unit_price, as_of_date")
        .in("asset_id", assetIds)
        .order("as_of_date", { ascending: false })
    : { data: [], error: null };

  if (pricesResult.error) throw new Error(pricesResult.error.message);

  const latestPriceMap = new Map<string, number>();
  for (const row of (pricesResult.data ?? []) as (AssetPriceRow & { as_of_date: string })[]) {
    if (!latestPriceMap.has(row.asset_id)) {
      latestPriceMap.set(row.asset_id, Number(row.unit_price));
    }
  }

  const classValueMap = new Map<string, number>();
  for (const asset of assets) {
    const value = Number(asset.quantity) * (latestPriceMap.get(asset.id) ?? 0);
    const current = classValueMap.get(asset.asset_class) ?? 0;
    classValueMap.set(asset.asset_class, current + value);
  }

  const values = Array.from(classValueMap.values()).filter((value) => value > 0);
  const totalValue = values.reduce((sum, value) => sum + value, 0);
  const diversificationHHI = totalValue > 0
    ? values.reduce((sum, value) => {
        const share = value / totalValue;
        return sum + share * share;
      }, 0)
    : null;

  const health = computeFinancialHealth({
    monthlySavings: Number(core.monthly_savings),
    savingsRate: core.savings_rate,
    emergencyMonths: core.emergency_months,
    debtServiceRatio: core.debt_service_ratio,
    totalAssets: Number(core.total_assets),
    totalLiabilities: Number(core.total_liabilities),
    netWorthTrend: trend,
    goalsProgressRatio: goalProgressRatios.length
      ? goalProgressRatios.reduce((sum, value) => sum + value, 0) / goalProgressRatios.length
      : null,
    goalsOnTrackRatio: goalOnTrackValues.length
      ? goalOnTrackValues.reduce((sum, value) => sum + value, 0) / goalOnTrackValues.length
      : null,
    diversificationHHI,
  });

  const snapshotMonth = firstOfCurrentMonthISO();

  const upsertResult = await supabase.from("health_score_snapshots").upsert(
    {
      household_id: householdId,
      snapshot_month: snapshotMonth,
      overall_score: health.overallScore,
      cashflow_score: health.factorScores.cashflow,
      emergency_score: health.factorScores.emergency,
      debt_score: health.factorScores.debt,
      networth_score: health.factorScores.networth,
      goals_score: health.factorScores.goals,
      diversification_score: health.factorScores.diversification,
      metrics_json: {
        ...health.metrics,
        weights: health.weights,
      },
      top_action: health.topAction,
    },
    { onConflict: "household_id,snapshot_month" },
  );

  if (upsertResult.error) throw new Error(upsertResult.error.message);

  return {
    snapshotMonth,
    overallScore: health.overallScore,
    factorScores: health.factorScores,
    weights: health.weights,
    topAction: health.topAction,
    metrics: health.metrics,
  };
}
