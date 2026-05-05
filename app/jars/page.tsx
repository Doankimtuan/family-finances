import type { ElementType } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, Eye, PiggyBank, Wallet } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { fetchJarCommandCenter } from "@/lib/jars/intent";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/dictionary";

import { JarPlanForm } from "./_components/jar-plan-form";
import { JarManualAdjustmentForm } from "./_components/jar-manual-adjustment-form";
import { SummaryCard } from "./_components/summary-card";
import { MiniMetric } from "./_components/mini-metric";

export const metadata = {
  title: "Jars | Family Finances",
};

export default async function JarsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const { householdId, householdLocale, language } = await getAuthenticatedHouseholdContext();
  const params = searchParams ? await searchParams : undefined;
  const month =
    params?.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);
  const supabase = await createClient();
  const data = await fetchJarCommandCenter(supabase, householdId, `${month}-01`);

  return (
    <AppShell
      header={<AppHeader title={t(language, "jars.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        {params?.success ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertDescription>{params.success}</AlertDescription>
          </Alert>
        ) : null}
        {params?.error ? (
          <Alert className="border-rose-200 bg-rose-50 text-rose-900">
            <AlertDescription>{params.error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-50 via-white to-amber-50/50">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <PiggyBank className="h-3.5 w-3.5" />
                  {t(language, "jars.intent_layer")}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {t(language, "jars.system_title")}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {t(language, "jars.system_description")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/jars/review`}>
                    {t(language, "jars.review_queue")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild className="rounded-xl">
                  <Link href={`/jars/setup?month=${month}`}>
                    {t(language, "jars.setup_jars")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title={t(language, "jars.summary.total_balance")}
                value={formatVndCompact(data.summary.totalBalance, householdLocale)}
                helper={formatVnd(data.summary.totalBalance, householdLocale)}
              />
              <SummaryCard
                title={t(language, "jars.summary.monthly_inflow")}
                value={formatVndCompact(data.summary.totalMonthInflow, householdLocale)}
                helper={t(language, "jars.summary.inflow_helper")}
              />
              <SummaryCard
                title={t(language, "jars.summary.monthly_outflow")}
                value={formatVndCompact(data.summary.totalMonthOutflow, householdLocale)}
                helper={t(language, "jars.summary.outflow_helper")}
              />
              <SummaryCard
                title={t(language, "jars.review_queue")}
                value={String(data.summary.pendingReviews)}
                helper={t(language, "jars.summary.rules_active", { count: String(data.summary.mappedExpenseRules) })}
              />
            </div>
          </CardContent>
        </Card>

        {data.items.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title={t(language, "jars.empty.title")}
            description={t(language, "jars.empty.description")}
            className="min-h-[280px] border-border/60 bg-slate-50/60"
            action={
              <Button asChild className="rounded-xl">
                <Link href={`/jars/setup?month=${month}`}>{t(language, "jars.empty.action")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t(language, "jars.status.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.items.map((jar) => {
                    const heldOutsideCash =
                      jar.heldInSavings + jar.heldInInvestments + jar.heldInAssets;
                    return (
                      <div
                        key={jar.id}
                        className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: jar.color ?? "#64748B" }}
                              />
                              <h2 className="text-base font-semibold text-slate-950">
                                {jar.name}
                              </h2>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {t(language, `jars.type.${jar.jar_type}`)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">
                              {t(language, "jars.item.current_balance")} {formatVnd(jar.currentBalance, householdLocale)}.
                              {jar.monthlyIncomePercent > 0
                                ? ` ${t(language, "jars.item.plan_percent", { percent: jar.monthlyIncomePercent.toFixed(0) })}`
                                : jar.monthlyTarget > 0
                                  ? ` ${t(language, "jars.item.plan_fixed", { amount: formatVnd(jar.monthlyTarget, householdLocale) })}`
                                  : ` ${t(language, "jars.item.no_plan")}`}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="rounded-xl">
                              <Link href={`/jars/${jar.id}`}>{t(language, "common.details")}</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="rounded-xl">
                              <Link href={`/jars/setup?month=${month}#rules`}>{t(language, "jars.item.edit_rules")}</Link>
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <MiniMetric
                            icon={Wallet}
                            label={t(language, "jars.metric.in_cash")}
                            value={formatVndCompact(jar.heldInCash, householdLocale)}
                          />
                          <MiniMetric
                            icon={PiggyBank}
                            label={t(language, "jars.metric.in_savings")}
                            value={formatVndCompact(jar.heldInSavings, householdLocale)}
                          />
                          <MiniMetric
                            icon={Coins}
                            label={t(language, "jars.metric.in_investments")}
                            value={formatVndCompact(jar.heldInInvestments, householdLocale)}
                          />
                          <MiniMetric
                            icon={CheckCircle2}
                            label={t(language, "jars.metric.outside_cash")}
                            value={formatVndCompact(heldOutsideCash, householdLocale)}
                          />
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between text-sm">
                              <Label className="font-medium text-slate-600">{t(language, "jars.item.monthly_inflow")}</Label>
                              <span className="font-semibold text-slate-950">
                                {formatVndCompact(jar.monthInflow, householdLocale)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                              <Label className="font-medium text-slate-600">{t(language, "jars.item.monthly_outflow")}</Label>
                              <span className="font-semibold text-slate-950">
                                {formatVndCompact(jar.monthOutflow, householdLocale)}
                              </span>
                            </div>
                          </div>

                          <JarPlanForm
                            jarId={jar.id}
                            month={month}
                            defaultFixed={jar.monthlyTarget}
                            defaultPercent={jar.monthlyIncomePercent}
                            returnTo={`/jars?month=${month}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t(language, "jars.review_queue")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.reviews.length === 0 ? (
                      <EmptyState
                        icon={Eye}
                        title={t(language, "jars.review.empty_title")}
                        description={t(language, "jars.review.empty_description")}
                        className="min-h-[180px] border-0 bg-transparent p-0"
                      />
                    ) : (
                      data.reviews.slice(0, 5).map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-border/60 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {review.source_type}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {review.movement_date} · {formatVnd(review.amount, householdLocale)}
                              </p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                              {t(language, "common.status.pending")}
                            </span>
                          </div>
                          {review.suggested_allocations.length > 0 ? (
                            <div className="mt-3 space-y-1.5">
                              {review.suggested_allocations.slice(0, 3).map((item) => (
                                <div
                                  key={`${review.id}-${item.jarId}`}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-slate-600">{item.jarName}</span>
                                  <span className="font-medium text-slate-900">
                                    {formatVndCompact(item.amount, householdLocale)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                    <Button asChild className="w-full rounded-xl">
                      <Link href="/jars/review">{t(language, "jars.review.open_queue")}</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t(language, "jars.manual_adjustment.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <JarManualAdjustmentForm
                      jars={data.items}
                      month={month}
                      returnTo={`/jars?month=${month}`}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

