import Link from "next/link";

import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { formatMonths, formatPercent, formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingFirstInsightPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const [metricsResult, goalsResult] = await Promise.all([
    supabase.rpc("rpc_dashboard_core", {
      p_household_id: householdId,
      p_as_of_date: new Date().toISOString().slice(0, 10),
    }),
    supabase
      .from("goals")
      .select("name, target_amount, target_date")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const metrics = metricsResult.data?.[0] ?? null;
  const primaryGoal = goalsResult.data ?? null;

  const insightText = metrics
    ? metrics.monthly_savings > 0
      ? `At your current monthly savings (${formatVnd(metrics.monthly_savings)}), you are building positive momentum.`
      : "Your current monthly cash flow is negative. Reducing expenses or increasing income is your highest-impact action."
    : "Add more data over the next few days to generate richer insights.";

  return (
    <OnboardingShell
      step={8}
      title="First Insight"
      description="You now have an initial household financial picture."
      prevHref="/onboarding/first-goal"
    >
      {metrics ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Net Worth</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.net_worth)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Monthly Savings</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.monthly_savings)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Savings Rate</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatPercent(metrics.savings_rate)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Emergency Runway</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMonths(metrics.emergency_months)}</p>
          </article>
        </div>
      ) : (
        <p className="text-sm text-slate-600">No metrics yet. Continue logging transactions and values.</p>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-700">{insightText}</p>
        {primaryGoal ? (
          <p className="mt-2 text-sm text-slate-600">
            Primary goal: <span className="font-medium text-slate-800">{primaryGoal.name}</span>
            {primaryGoal.target_date ? ` by ${new Date(primaryGoal.target_date).toLocaleDateString("en-US")}` : ""}
            {` (target ${formatVnd(primaryGoal.target_amount)}).`}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Open Dashboard
        </Link>
        <Link href="/transactions" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Log First Transaction
        </Link>
      </div>
    </OnboardingShell>
  );
}
