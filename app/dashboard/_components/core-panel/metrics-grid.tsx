"use client";

import { Wallet } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  formatPercent,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

type MetricsGridProps = {
  metrics: {
    monthly_income: number;
    monthly_expense: number;
    savings_rate: number | null;
    savings_rate_6mo_avg: number | null;
  };
  savingsRateMomDeltaPct: number | null;
};

export function MetricsGrid({
  metrics,
  savingsRateMomDeltaPct,
}: MetricsGridProps) {
  const { locale, t } = useI18n();

  return (
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
          href="/activity"
        />
        <MetricCard
          label={t("dashboard.metrics.spending")}
          value={formatVndCompact(Number(metrics.monthly_expense), locale)}
          variant="destructive"
          href="/activity"
        />
        <MetricCard
          label={t("dashboard.metrics.savings_rate")}
          value={formatPercent(metrics.savings_rate ?? 0)}
          href="/accounts"
          note={`${t("dashboard.metrics.savings_rate_avg")}: ${formatPercent(metrics.savings_rate_6mo_avg ?? 0)}`}
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
  );
}
