"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { HeartPulse, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { isFeatureEnabled } from "@/lib/config/features";
import {
  formatDate,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

import { MaturityTimelineWidget } from "./maturity-timeline-widget";
import { HeroSection } from "./core-panel/hero-section";
import { TopActionBanner } from "./core-panel/top-action-banner";
import { MetricsGrid } from "./core-panel/metrics-grid";
import { ActionFeed } from "./core-panel/action-feed";
import { SnapshotsSection } from "./core-panel/snapshots-section";
import { RecentActivity } from "./core-panel/recent-activity";
import { HealthFactors } from "./core-panel/health-factors";
import { TransparencySection } from "./core-panel/transparency-section";
import { QuickActionsSection } from "./core-panel/quick-actions";
import { useDashboardData } from "../_hooks/use-dashboard-data";

const NetWorthTrend = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.NetWorthTrend),
  { ssr: false },
);

const MonthlyExpenseAllocation = dynamic(
  () =>
    import("./dashboard-charts").then((mod) => mod.MonthlyExpenseAllocation),
  { ssr: false },
);

export function DashboardCorePanel() {
  const { locale, t } = useI18n();
  const jarsEnabled = isFeatureEnabled("jars");

  const { data: payload, isError, error, refetch } = useDashboardData();

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
            <Link href="/accounts">{t("dashboard.empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  const { metrics, trend } = payload;
  const healthScore = payload.health?.overallScore ?? null;
  const topAction = t(payload.health?.topAction ?? "health.action.no_data");

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

  const actionItems = [
    ...((payload.pendingJarReviews ?? 0) > 0
        ? [
          {
            id: "jar-review-queue",
            title: t("dashboard.actions.jar_review_title"),
            description: t("dashboard.actions.jar_review_description"),
            amountLabel: `${payload.pendingJarReviews ?? 0} ${t("dashboard.actions.jar_review_count")}`,
            metaLabel: t("dashboard.actions.open_jars"),
            href: "/goals/jars/review",
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
    ...(payload.spendingJarAlerts ?? []).map((alert) => ({
      id: `jar-${alert.jarId}`,
      title: alert.jarName,
      description:
        alert.alertLevel === "exceeded"
          ? t("dashboard.actions.jar_exceeded")
          : t("dashboard.actions.jar_warning"),
      amountLabel: `${formatVndCompact(alert.spent, locale)} / ${formatVndCompact(alert.limit, locale)}`,
      metaLabel:
        alert.usagePercent === null ? "-" : `${alert.usagePercent.toFixed(1)}%`,
      href: "/goals?tab=jars",
      tone:
        alert.alertLevel === "exceeded" ? ("destructive" as const) : ("warning" as const),
    })),
  ];

  return (
    <section className="space-y-6 pb-12">
      <HeroSection
        metrics={{
          net_worth: Number(metrics.net_worth),
          emergency_months: metrics.emergency_months,
        }}
        healthScore={healthScore}
        tdsrValue={tdsrValue}
        debtPressureNote={debtPressureNote}
      />

      <TopActionBanner
        healthScore={healthScore}
        topAction={topAction}
      />

      <MetricsGrid
        metrics={{
          monthly_income: Number(metrics.monthly_income),
          monthly_expense: Number(metrics.monthly_expense),
          savings_rate: metrics.savings_rate,
          savings_rate_6mo_avg: metrics.savings_rate_6mo_avg,
        }}
        savingsRateMomDeltaPct={savingsRateMomDeltaPct}
      />

      <ActionFeed
        actionItems={actionItems}
        timelineWidget={<MaturityTimelineWidget />}
      />

      <SnapshotsSection
        goals={payload.goals ?? []}
        jars={payload.jars ?? []}
        jarsEnabled={jarsEnabled}
      />

      <ErrorBoundary title={t("dashboard.error.chart_title")}>
        <NetWorthTrend trend={trend} />
      </ErrorBoundary>

      <ErrorBoundary title={t("dashboard.error.chart_title")}>
        <MonthlyExpenseAllocation
          expenseRows={payload.drilldowns?.cashFlow.expense ?? []}
        />
      </ErrorBoundary>

      <RecentActivity transactions={payload.recentTransactions ?? []} />

      {payload.health && (
        <ErrorBoundary title={t("dashboard.error.health_title")}>
          <HealthFactors healthData={payload.health} />
        </ErrorBoundary>
      )}

      <TransparencySection drilldowns={payload.drilldowns} />

      <QuickActionsSection
        jarsEnabled={jarsEnabled}
      />
    </section>
  );
}
