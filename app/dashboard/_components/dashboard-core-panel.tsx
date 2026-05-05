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
import { calculateSavingsRateDelta, getDebtPressureNote } from "@/lib/dashboard/utils";

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
import { useActionItems } from "../_hooks/use-action-items";

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
  const actionItems = useActionItems(payload, locale, t);

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

  const savingsRateMomDeltaPct = calculateSavingsRateDelta(metrics.savings_rate_mom_delta);
  const tdsrValue = Number(metrics.tdsr_percent);
  const debtPressureNote = getDebtPressureNote(tdsrValue, t);

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
