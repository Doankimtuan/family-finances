import type { SupabaseClient } from "@supabase/supabase-js";

import { getDashboardTrend } from "@/lib/dashboard/trend";
import type { AppLanguage } from "@/lib/i18n/config";
import {
  buildInsights,
  detectDebtAlert,
  detectGoalRisk,
  detectNetWorthChange,
  detectSavingsMilestone,
  detectSpendingAnomaly,
  type InsightRecord,
} from "@/lib/insights/engine";

type CoreRow = {
  net_worth: number;
  monthly_income: number;
  monthly_expense: number;
  emergency_months: number | null;
  debt_service_ratio: number | null;
};

type GoalRow = { id: string; name: string; target_amount: number; target_date: string | null };

type ContributionRow = { goal_id: string; amount: number; contribution_date: string };

type LiabilityRow = {
  id: string;
  liability_type: string;
  promo_rate_annual: number | null;
  floating_rate_margin: number | null;
  promo_months: number | null;
  start_date: string;
  current_principal_outstanding: number;
};

function monthDiff(now: Date, target: Date) {
  return (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + (target.getUTCMonth() - now.getUTCMonth());
}

function estimateRateSwitchPaymentIncrease(liabilities: LiabilityRow[]) {
  let totalIncrease = 0;

  for (const debt of liabilities) {
    if (debt.liability_type !== "mortgage") continue;
    if (!debt.promo_rate_annual || !debt.floating_rate_margin || !debt.promo_months) continue;

    const start = new Date(debt.start_date);
    const now = new Date();
    const elapsed = Math.max(0, monthDiff(start, now));
    const promoLeft = debt.promo_months - elapsed;
    if (promoLeft > 6) continue;

    const principal = Number(debt.current_principal_outstanding);
    const promoInterest = principal * (debt.promo_rate_annual / 12);
    const floatingInterest = principal * ((debt.promo_rate_annual + debt.floating_rate_margin) / 12);

    const delta = Math.max(0, Math.round(floatingInterest - promoInterest));
    totalIncrease += delta;
  }

  return totalIncrease > 0 ? totalIncrease : null;
}

export async function calculateAndPersistInsights(
  supabase: SupabaseClient,
  householdId: string,
  asOfDate: string,
  options?: { language?: AppLanguage; locale?: string },
) {
  const language = options?.language ?? "en";
  const locale = options?.locale ?? "en-US";
  const [coreResult, goalsResult, liabilitiesResult] = await Promise.all([
    supabase.rpc("rpc_dashboard_core", { p_household_id: householdId, p_as_of_date: asOfDate }),
    supabase.from("goals").select("id, name, target_amount, target_date").eq("household_id", householdId).eq("status", "active"),
    supabase
      .from("liabilities")
      .select("id, liability_type, promo_rate_annual, floating_rate_margin, promo_months, start_date, current_principal_outstanding")
      .eq("household_id", householdId)
      .eq("is_active", true),
  ]);

  if (coreResult.error) throw new Error(coreResult.error.message);
  if (goalsResult.error) throw new Error(goalsResult.error.message);
  if (liabilitiesResult.error) throw new Error(liabilitiesResult.error.message);

  const core = ((coreResult.data ?? []) as CoreRow[])[0] ?? null;
  if (!core) throw new Error("Missing core metrics for insights.");

  const trend = await getDashboardTrend(supabase, householdId, { months: 6, asOfDate });
  const prev = trend.length >= 2 ? trend[trend.length - 2] : null;
  const priorExpenses = trend
    .slice(Math.max(0, trend.length - 4), Math.max(0, trend.length - 1))
    .map((t) => Number(t.expense));
  const avgPriorExpense = priorExpenses.length
    ? priorExpenses.reduce((sum, value) => sum + value, 0) / priorExpenses.length
    : 0;

  const goals = (goalsResult.data ?? []) as GoalRow[];
  const goalIds = goals.map((g) => g.id);
  const contributionsResult = goalIds.length
    ? await supabase.from("goal_contributions").select("goal_id, amount, contribution_date").eq("household_id", householdId).in("goal_id", goalIds)
    : { data: [], error: null };
  if (contributionsResult.error) throw new Error(contributionsResult.error.message);
  const contributions = (contributionsResult.data ?? []) as ContributionRow[];

  const contribMap = new Map<string, ContributionRow[]>();
  for (const row of contributions) {
    const arr = contribMap.get(row.goal_id) ?? [];
    arr.push(row);
    contribMap.set(row.goal_id, arr);
  }

  const now = new Date();
  const sixMonthAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1));

  const goalRiskInput = goals.map((goal) => {
    const rows = contribMap.get(goal.id) ?? [];
    const funded = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const remaining = Math.max(0, Number(goal.target_amount) - funded);

    const requiredMonthly = goal.target_date
      ? Math.ceil(remaining / Math.max(1, monthDiff(now, new Date(goal.target_date))))
      : null;

    const avgMonthlyContribution = Math.round(
      rows
        .filter((row) => new Date(row.contribution_date) >= sixMonthAgo)
        .reduce((sum, row) => sum + Number(row.amount), 0) / 6,
    );

    return {
      name: goal.name,
      targetDate: goal.target_date,
      remaining,
      requiredMonthly,
      avgMonthlyContribution,
    };
  });

  const paymentIncrease = estimateRateSwitchPaymentIncrease((liabilitiesResult.data ?? []) as LiabilityRow[]);

  const insights = buildInsights([
    detectSpendingAnomaly({
      currentExpense: Number(core.monthly_expense),
      avgPriorExpense,
      language,
    }),
    detectGoalRisk({ goals: goalRiskInput, language, locale }),
    detectDebtAlert({
      debtServiceRatio: core.debt_service_ratio,
      nextPaymentIncreaseAmount: paymentIncrease,
      hasActiveDebt: ((liabilitiesResult.data ?? []) as LiabilityRow[]).length > 0,
      monthlyIncome: Number(core.monthly_income),
      monthlyExpense: Number(core.monthly_expense),
      language,
      locale,
    }),
    detectSavingsMilestone({
      emergencyMonths: core.emergency_months,
      prevEmergencyMonths: prev?.emergency_months ?? null,
      language,
    }),
    detectNetWorthChange({
      currentNetWorth: Number(core.net_worth),
      prevNetWorth: prev ? Number(prev.net_worth) : null,
      language,
    }),
  ]);

  // Keep user-dismissed insights; refresh only active generated insight types.
  const purge = await supabase
    .from("insights")
    .delete()
    .eq("household_id", householdId)
    .eq("is_dismissed", false)
    .in("insight_type", ["spending_anomaly", "goal_risk", "debt_alert", "savings_milestone", "net_worth_change"]);
  if (purge.error) throw new Error(purge.error.message);

  if (insights.length > 0) {
    const insert = await supabase.from("insights").insert(
      insights.map((insight) => ({
        household_id: householdId,
        insight_type: insight.insightType,
        severity: insight.severity,
        title: insight.title,
        body: insight.body,
        action_label: insight.actionLabel,
        action_target: insight.actionTarget,
        is_dismissed: false,
      })),
    );

    if (insert.error) throw new Error(insert.error.message);
  }

  return insights as InsightRecord[];
}
