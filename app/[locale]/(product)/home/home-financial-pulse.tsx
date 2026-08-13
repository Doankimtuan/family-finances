import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
  type HomeDashboardPeriod,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatPercent } from "@/shared/i18n/formatters";
import { Balance } from "@/shared/patterns/balance";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

export function HomeFinancialPulse({
  balance,
  currency,
  locale,
  period,
  metrics,
  action,
}: {
  balance: number;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
  metrics: HomeFinancialMetrics | null;
  action?: ReactNode;
}) {
  const t = useTranslations("home");
  const state =
    metrics == null || !metrics.hasTransactions
      ? "unavailable"
      : metrics.netCashFlow >= 0
        ? "positive"
        : "attention";
  const comparison = metrics?.netCashFlowComparison ?? null;

  return (
    <KpiBlock
      title={t("financialPulse.title")}
      description={t("financialPulse.hint")}
      variant="prominent"
      data-testid={HOME_TEST_ID.FINANCIAL_PULSE}
    >
      <div className="flex flex-col gap-(--space-3)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Balance
              amountLabel={formatCurrency(balance, currency, locale, {
                maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
              })}
              size="lg"
            />
          </div>
          {action}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-(--space-3) border-t border-accent/15 pt-(--space-3)">
          <div className="min-w-0">
            <Text size="sm" tone="secondary">
              {t(`financialPulse.netLabel.${period}`)}
            </Text>
            <Text
              size="lg"
              className="mt-(--space-1) font-semibold tabular-nums text-text-primary"
            >
              {metrics
                ? formatCurrency(metrics.netCashFlow, currency, locale, {
                    maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                  })
                : t("common.unavailable")}
            </Text>
          </div>
          <div className="flex min-w-0 flex-col items-end gap-(--space-1)">
            <StatusBadge
              tone={
                state === "positive"
                  ? "positive"
                  : state === "attention"
                    ? "attention"
                    : "neutral"
              }
            >
              {t(`financialPulse.status.${state}`)}
            </StatusBadge>
            {comparison ? (
              <Text size="sm" tone="secondary" className="text-right">
                {t("financialPulse.comparison", {
                  value: formatPercent(comparison.ratio, locale, {
                    maximumFractionDigits: 1,
                    signDisplay: "always",
                  }),
                })}
              </Text>
            ) : null}
          </div>
        </div>
      </div>
    </KpiBlock>
  );
}
