"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  HeartPulse,
  History,
  Info,
  Receipt,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { isFeatureEnabled } from "@/lib/config/features";
import {
  formatDate,
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

import { MaturityTimelineWidget } from "./maturity-timeline-widget";

const NetWorthTrend = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.NetWorthTrend),
  { ssr: false },
);

const MonthlyExpenseAllocation = dynamic(
  () =>
    import("./dashboard-charts").then((mod) => mod.MonthlyExpenseAllocation),
  { ssr: false },
);

type ActionFeedItem = {
  id: string;
  title: string;
  description: string;
  amountLabel: string;
  metaLabel: string;
  href: string;
  tone: "warning" | "destructive";
};

export function DashboardCorePanel() {
  const { locale, t } = useI18n();
  const jarsEnabled = isFeatureEnabled("jars");
  const financialHealthEnabled = isFeatureEnabled("financialHealth");

  const {
    data: payload,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardCoreResponse>({
    queryKey: ["dashboard-core"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/core?months=6", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Request failed with status ${response.status}`,
        );
      }

      return (await response.json()) as DashboardCoreResponse;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="space-y-6" aria-busy="true">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </section>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={HeartPulse}
        title={t("dashboard.error.title")}
        description={error instanceof Error ? error.message : t("common.no_data")}
        action={
          <Button onClick={() => void refetch()} variant="outline" size="sm">
            {t("dashboard.error.retry")}
          </Button>
        }
        className="border-destructive/20 bg-destructive/5"
      />
    );
  }

  if (!payload?.metrics) {
    return (
      <EmptyState
        icon={Sparkles}
        title={t("dashboard.empty.title")}
        description={t("dashboard.empty.description")}
        action={
          <Button asChild size="sm">
            <Link href="/money">{t("dashboard.empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  const { metrics, trend } = payload;
  const score = payload.health?.overallScore ?? null;
  const topActionKey = payload.health?.topAction ?? "health.action.no_data";
  const topAction = t(topActionKey);

  const savingsRateMomDeltaRaw = Number(metrics.savings_rate_mom_delta);
  const savingsRateMomDeltaPct = Number.isFinite(savingsRateMomDeltaRaw)
    ? Number((savingsRateMomDeltaRaw * 100).toFixed(1))
    : null;
  const tdsrValue = Number(metrics.tdsr_percent);
  const debtPressureNote = !Number.isFinite(tdsrValue)
    ? t("dashboard.metrics.debt_pressure.none")
    : tdsrValue > 50
      ? t("dashboard.metrics.debt_pressure.high")
      : tdsrValue >= 35
        ? t("dashboard.metrics.debt_pressure.watch")
        : t("dashboard.metrics.debt_pressure.normal");

  const actionItems: ActionFeedItem[] = [
    ...((payload.pendingJarReviews ?? 0) > 0
        ? [
          {
            id: "jar-review-queue",
            title: t("dashboard.actions.jar_review_title"),
            description: t("dashboard.actions.jar_review_description"),
            amountLabel: `${payload.pendingJarReviews ?? 0} ${t("dashboard.actions.jar_review_count")}`,
            metaLabel: t("dashboard.actions.open_jars"),
            href: "/jars/review",
            tone: "warning" as const,
          },
        ]
      : []),
    ...(payload.priorityActions ?? []).map((action) => ({
      id: `bill-${action.id}`,
      title: `${t("dashboard.actions.credit_card_title")} ${action.title.replace(/^Thanh toán thẻ\s*/i, "").trim()}`.trim(),
      description: t("dashboard.actions.credit_card_description"),
      amountLabel: formatVndCompact(action.amount, locale),
      metaLabel: formatDate(action.dueDate, locale),
      href: "/debts",
      tone: "warning" as const,
    })),
    ...((payload.spendingJarAlerts ?? []).map((alert) => ({
      id: `jar-${alert.jarId}`,
      title: alert.jarName,
      description:
        alert.alertLevel === "exceeded"
          ? t("dashboard.actions.jar_exceeded")
          : t("dashboard.actions.jar_warning"),
      amountLabel: `${formatVndCompact(alert.spent, locale)} / ${formatVndCompact(alert.limit, locale)}`,
      metaLabel:
        alert.usagePercent === null ? "-" : `${alert.usagePercent.toFixed(1)}%`,
      href: "/jars",
      tone:
        alert.alertLevel === "exceeded" ? ("destructive" as const) : ("warning" as const),
    })) ?? []),
  ];
  const recentTransactions = payload.recentTransactions ?? [];

  return (
    <section className="space-y-6 pb-12">
      <Card className="overflow-hidden border-none bg-linear-to-br from-primary via-primary/80 to-accent text-white shadow-xl">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute -right-8 top-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="relative space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
                {t("dashboard.hero.eyebrow")}
              </p>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {formatVndCompact(Number(metrics.net_worth), locale)}
                  </p>
                  <p className="text-sm text-white/80">
                    {formatVnd(Number(metrics.net_worth), locale)}
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-white/80">
                    {t("dashboard.hero.description")}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="shrink-0 rounded-full border-0 bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href="/money">
                    {t("dashboard.hero.open_money")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat
                label={t("dashboard.hero.health_score")}
                value={score === null ? "-" : `${score.toFixed(0)}/100`}
              />
              <HeroStat
                label={t("dashboard.hero.emergency_fund")}
                value={formatMonths(metrics.emergency_months, locale)}
              />
              <HeroStat
                label={t("dashboard.hero.debt_pressure")}
                value={Number.isFinite(tdsrValue) ? `${tdsrValue.toFixed(1)}%` : "-"}
                note={debtPressureNote}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/10 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-warning">
              <Sparkles className="h-4.5 w-4.5" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                {t("dashboard.hero.top_action")}
              </p>
            </div>
            <p className="text-sm font-semibold leading-6 text-foreground">
              {score === null
                ? t("dashboard.hero.health_pending")
                : topAction}
            </p>
          </div>
          {financialHealthEnabled ? (
            <Button asChild variant="outline" className="shrink-0 border-warning/40 bg-card/80">
              <Link href="/health">{t("dashboard.health.open")}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <SectionHeader
          icon={Wallet}
          label={t("dashboard.metrics.label")}
          title={t("dashboard.metrics.title")}
          description={t("dashboard.metrics.description")}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t("dashboard.metrics.income")}
            value={formatVndCompact(Number(metrics.monthly_income), locale)}
            variant="success"
            href="/transactions"
          />
          <MetricCard
            label={t("dashboard.metrics.spending")}
            value={formatVndCompact(Number(metrics.monthly_expense), locale)}
            variant="destructive"
            href="/transactions"
          />
          <MetricCard
            label={t("dashboard.metrics.savings_rate")}
            value={formatPercent(metrics.savings_rate)}
            href="/money"
            note={`${t("dashboard.metrics.savings_rate_avg")}: ${formatPercent(metrics.savings_rate_6mo_avg)}`}
            trend={
              savingsRateMomDeltaPct !== null
                ? {
                    value: savingsRateMomDeltaPct,
                    label: t("dashboard.metrics.vs_last_month"),
                  }
                : undefined
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader
          icon={AlertCircle}
          label={t("dashboard.actions.label")}
          title={t("dashboard.actions.title")}
          description={t("dashboard.actions.description")}
        />
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
          <Card className="border-border/60">
            <CardContent className="p-4">
              {actionItems.length > 0 ? (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          item.tone === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/15 text-warning",
                        )}
                      >
                        {item.href === "/debts" ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {item.amountLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.metaLabel}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={AlertCircle}
                  title={t("dashboard.actions.empty.title")}
                  description={t("dashboard.actions.empty.description")}
                />
              )}
            </CardContent>
          </Card>
          <MaturityTimelineWidget />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader
          icon={Target}
          label={t("dashboard.snapshots.label")}
          title={t("dashboard.snapshots.title")}
          description={t("dashboard.snapshots.description")}
        />
        <div
          className={cn(
            "grid gap-4",
            jarsEnabled ? "lg:grid-cols-2" : "lg:grid-cols-1",
          )}
        >
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("dashboard.goals.title")}
                </h2>
                <Link
                  href="/goals"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("dashboard.goals.view_all")}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {payload.goals && payload.goals.length > 0 ? (
                payload.goals.slice(0, 3).map((goal) => {
                  const pct = Math.min(
                    100,
                    Math.round((goal.current_amount / goal.target_amount) * 100),
                  );
                  return (
                    <div
                      key={goal.id}
                      className="rounded-2xl border border-border/60 bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {goal.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatVndCompact(goal.current_amount, locale)} /{" "}
                            {formatVndCompact(goal.target_amount, locale)}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 rounded-full">
                          {pct}%
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Target}
                  title={t("dashboard.goals.title")}
                  description={t("dashboard.goals.empty")}
                />
              )}
            </CardContent>
          </Card>

          {jarsEnabled ? (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("dashboard.jars.title")}
                  </h2>
                  <Link
                    href="/jars"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t("dashboard.jars.open")}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {payload.jars && payload.jars.length > 0 ? (
                  payload.jars.slice(0, 3).map((jar) => {
                    const coverage = Math.round(jar.coverage_ratio * 100);
                    return (
                      <div
                        key={jar.jar_id}
                        className="rounded-2xl border border-border/60 bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {jar.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatVndCompact(jar.net_amount, locale)} /{" "}
                              {formatVndCompact(jar.target_amount, locale)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 rounded-full"
                          >
                            {coverage}%
                          </Badge>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              coverage >= 100
                                ? "bg-success"
                                : coverage >= 75
                                  ? "bg-warning"
                                  : "bg-primary",
                            )}
                            style={{
                              width: `${Math.min(100, Math.max(0, coverage))}%`,
                            }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {coverage < 100
                              ? t("dashboard.jars.title")
                              : t("dashboard.actions.empty.title")}
                          </span>
                          <Link
                            href="/jars"
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {t("dashboard.jars.allocate")}
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={Wallet}
                    title={t("dashboard.jars.title")}
                    description={t("dashboard.jars.empty")}
                  />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <NetWorthTrend trend={trend} />

      <MonthlyExpenseAllocation
        expenseRows={payload.drilldowns?.cashFlow.expense ?? []}
      />

      {recentTransactions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SectionHeader
              icon={Receipt}
              label={t("dashboard.activity.label")}
              title={t("dashboard.activity.title")}
            />
            <Link
              href="/transactions"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("dashboard.activity.view_more")}
            </Link>
          </div>
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-0">
              {recentTransactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={cn(
                    "flex items-center gap-3 p-4 transition-colors hover:bg-muted/30",
                    idx !== recentTransactions.length - 1 && "border-b border-border/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      tx.type === "income"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {tx.description ?? tx.category_name ?? t("transactions.uncategorized")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category_name ?? formatDate(tx.transaction_date, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        tx.type === "income" ? "text-emerald-600" : "text-foreground",
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatVndCompact(tx.amount, locale)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(tx.transaction_date, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {financialHealthEnabled && payload.health ? (
        <Card className="border-border/60 bg-linear-to-br from-amber-50 via-orange-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                icon={Zap}
                label={t("dashboard.health.label")}
                title={t("dashboard.health.title")}
                description={t("dashboard.health.description")}
              />
              <Button asChild variant="outline" size="sm">
                <Link href="/health">{t("dashboard.health.open")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthFactor
              label={t("dashboard.health.factor.cashflow")}
              score={payload.health.factorScores.cashflow}
              color="bg-amber-500"
            />
            <HealthFactor
              label={t("dashboard.health.factor.emergency")}
              score={payload.health.factorScores.emergency}
              color="bg-emerald-500"
            />
            <HealthFactor
              label={t("dashboard.health.factor.debt")}
              score={payload.health.factorScores.debt}
              color="bg-blue-500"
            />
            <HealthFactor
              label={t("dashboard.health.factor.goals")}
              score={payload.health.factorScores.goals}
              color="bg-purple-500"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Info}
            label={t("dashboard.transparency.label")}
            title={t("dashboard.transparency.title")}
            description={t("dashboard.transparency.description")}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="group rounded-2xl border border-border/60 bg-muted/10 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {t("dashboard.transparency.networth")}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TransparencyList
                title={t("dashboard.transparency.assets")}
                rows={payload.drilldowns?.netWorth.assets ?? []}
                locale={locale}
                tone="success"
              />
              <TransparencyList
                title={t("dashboard.transparency.liabilities")}
                rows={payload.drilldowns?.netWorth.liabilities ?? []}
                locale={locale}
                tone="destructive"
              />
            </div>
          </details>

          <details className="group rounded-2xl border border-border/60 bg-muted/10 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {t("dashboard.transparency.cashflow")}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("dashboard.transparency.window")}:{" "}
              {payload.drilldowns?.cashFlow.monthStart} -{" "}
              {payload.drilldowns?.cashFlow.monthEnd}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TransparencyList
                title={t("dashboard.transparency.income")}
                rows={payload.drilldowns?.cashFlow.income ?? []}
                locale={locale}
                tone="success"
              />
              <TransparencyList
                title={t("dashboard.transparency.spending")}
                rows={payload.drilldowns?.cashFlow.expense ?? []}
                locale={locale}
                tone="destructive"
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-transparent shadow-none">
        <CardHeader className="px-0">
          <SectionHeader
            icon={History}
            label={t("dashboard.shortcuts.label")}
            title={t("dashboard.shortcuts.title")}
          />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 px-0 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction
            href="/transactions"
            icon={History}
            label={t("dashboard.shortcuts.transactions")}
            variant="primary"
          />
          <QuickAction
            href="/money"
            icon={Wallet}
            label={t("dashboard.shortcuts.money")}
          />
          <QuickAction
            href="/goals"
            icon={Target}
            label={t("dashboard.shortcuts.goals")}
          />
          {jarsEnabled ? (
            <QuickAction
              href="/jars"
              icon={Sparkles}
              label={t("dashboard.shortcuts.jars")}
            />
          ) : null}
          {financialHealthEnabled ? (
            <QuickAction
              href="/health"
              icon={HeartPulse}
              label={t("dashboard.shortcuts.health")}
            />
          ) : null}
          <QuickAction
            href="/insights"
            icon={Zap}
            label={t("dashboard.shortcuts.insights")}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function HeroStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      {note ? <p className="mt-1 text-xs text-white/75">{note}</p> : null}
    </div>
  );
}

function HealthFactor({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-700">{score}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function TransparencyList({
  title,
  rows,
  locale,
  tone,
}: {
  title: string;
  rows: Array<{ label: string; value: number; source: string }>;
  locale: string;
  tone: "success" | "destructive";
}) {
  return (
    <div className="space-y-2">
      <p
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.16em]",
          tone === "success" ? "text-emerald-600" : "text-destructive",
        )}
      >
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.source}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2"
          >
            <span className="truncate text-xs font-medium text-foreground">
              {row.label}
            </span>
            <span className="text-xs font-bold text-foreground">
              {formatVndCompact(row.value, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  variant = "secondary",
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "h-auto flex-col items-center justify-center gap-2 rounded-2xl p-4",
        variant === "secondary" &&
          "border-border bg-card shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
      )}
    >
      <Link href={href}>
        <Icon
          className={cn(
            "h-5 w-5",
            variant === "primary" ? "text-primary-foreground" : "text-primary/80",
          )}
        />
        <span className="text-xs font-bold leading-tight">{label}</span>
      </Link>
    </Button>
  );
}
