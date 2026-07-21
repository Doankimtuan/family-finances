"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  formatPercent,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

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

      <div className="space-y-3">
        <Link href="/accounts" className="block">
          <div
            className={cn(
              "rounded-2xl border border-primary/15 bg-primary/5 p-5 transition-all duration-200",
              "hover:border-primary/30 hover:bg-primary/8 active:scale-[0.99]",
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.metrics.savings_rate")}
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold tabular-nums tracking-tight text-primary">
              {formatPercent(metrics.savings_rate ?? 0)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("dashboard.metrics.savings_rate_avg")}:{" "}
              {formatPercent(metrics.savings_rate_6mo_avg ?? 0)}
              {savingsRateMomDeltaPct !== null && (
                <span className="ml-2 text-foreground/70">
                  · {t("dashboard.metrics.vs_last_month")}{" "}
                  {savingsRateMomDeltaPct > 0 ? "+" : ""}
                  {savingsRateMomDeltaPct}%
                </span>
              )}
            </p>
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      </div>
    </div>
  );
}
