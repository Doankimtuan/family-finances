import Link from "next/link";

import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { formatDate, formatMonths, formatPercent, formatVnd } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingFirstInsightPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
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
      ? t(language, "onboarding.first_insight.positive_savings").replace("{amount}", formatVnd(metrics.monthly_savings, householdLocale))
      : t(language, "onboarding.first_insight.negative_cashflow")
    : t(language, "onboarding.first_insight.add_data");

  return (
    <OnboardingShell
      step={8}
      title={t(language, "onboarding.first_insight.title")}
      description={t(language, "onboarding.first_insight.description")}
      prevHref="/onboarding/first-goal"
    >
      {metrics ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t(language, "onboarding.first_insight.net_worth")}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.net_worth, householdLocale)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t(language, "onboarding.first_insight.monthly_savings")}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.monthly_savings, householdLocale)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t(language, "onboarding.first_insight.savings_rate")}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatPercent(metrics.savings_rate)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t(language, "onboarding.first_insight.emergency_runway")}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMonths(metrics.emergency_months, householdLocale)}</p>
          </article>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{t(language, "onboarding.first_insight.no_metrics")}</p>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-700">{insightText}</p>
        {primaryGoal ? (
          <p className="mt-2 text-sm text-slate-600">
            {t(language, "onboarding.first_insight.primary_goal")}: <span className="font-medium text-slate-800">{primaryGoal.name}</span>
            {primaryGoal.target_date ? ` ${t(language, "onboarding.first_insight.by")} ${formatDate(primaryGoal.target_date, householdLocale)}` : ""}
            {` (${t(language, "onboarding.first_insight.target")} ${formatVnd(primaryGoal.target_amount, householdLocale)}).`}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {t(language, "onboarding.first_insight.open_dashboard")}
        </Link>
        <Link href="/activity" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          {t(language, "onboarding.first_insight.log_transaction")}
        </Link>
      </div>
    </OnboardingShell>
  );
}
