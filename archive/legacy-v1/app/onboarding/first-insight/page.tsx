import Link from "next/link";
import { ArrowRight, Target, Wallet, ChartNoAxesCombined, CalendarDays } from "lucide-react";

import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { formatDate, formatMonths, formatPercent, formatVnd } from "@/lib/dashboard/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Card variant="elevated" className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t(language, "onboarding.first_insight.net_worth")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {formatVnd(metrics.net_worth, householdLocale)}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                  <Wallet className="mr-1 h-3.5 w-3.5" />
                  Snapshot
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t(language, "onboarding.first_insight.monthly_savings")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {formatVnd(metrics.monthly_savings, householdLocale)}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                  <ChartNoAxesCombined className="mr-1 h-3.5 w-3.5" />
                  Flow
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-border/70">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t(language, "onboarding.first_insight.savings_rate")}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {formatPercent(metrics.savings_rate)}
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-border/70">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t(language, "onboarding.first_insight.emergency_runway")}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {formatMonths(metrics.emergency_months, householdLocale)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-border/70 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t(language, "onboarding.first_insight.no_metrics")}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-muted/20">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{insightText}</span>
          </div>
          {primaryGoal ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {t(language, "onboarding.first_insight.primary_goal")}: <span className="font-semibold text-foreground">{primaryGoal.name}</span>
              {primaryGoal.target_date ? ` ${t(language, "onboarding.first_insight.by")} ${formatDate(primaryGoal.target_date, householdLocale)}` : ""}
              {` (${t(language, "onboarding.first_insight.target")} ${formatVnd(primaryGoal.target_amount, householdLocale)}).`}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard">
            {t(language, "onboarding.first_insight.open_dashboard")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/activity">
            {t(language, "onboarding.first_insight.log_transaction")}
          </Link>
        </Button>
      </div>
    </OnboardingShell>
  );
}
