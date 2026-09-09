"use client";

import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HomeFinancialPulseState,
  HOME_TEST_ID,
  type HomeDashboardPeriod,
} from "@/modules/home/application/home-constants";
import { formatCurrency, formatPercent } from "@/shared/i18n/formatters";
import {
  FinancialDeltaBadge,
  FinancialDeltaDirection,
  FinancialDeltaValue,
} from "@/shared/patterns";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

const NET_DELTA_DIRECTION: Record<
  HomeFinancialPulseState,
  FinancialDeltaDirection
> = {
  [HomeFinancialPulseState.POSITIVE]: FinancialDeltaDirection.POSITIVE,
  [HomeFinancialPulseState.NEGATIVE]: FinancialDeltaDirection.NEGATIVE,
  [HomeFinancialPulseState.UNAVAILABLE]: FinancialDeltaDirection.NEUTRAL,
};

const NET_STATUS_BADGE_TONE = {
  [HomeFinancialPulseState.POSITIVE]: StatusBadgeTone.POSITIVE,
  [HomeFinancialPulseState.NEGATIVE]: StatusBadgeTone.NEUTRAL,
  [HomeFinancialPulseState.UNAVAILABLE]: StatusBadgeTone.NEUTRAL,
} as const;

export function resolveHomeFinancialPulseState(
  metrics: HomeFinancialMetrics | null,
): HomeFinancialPulseState {
  if (metrics == null || !metrics.hasTransactions) {
    return HomeFinancialPulseState.UNAVAILABLE;
  }
  if (metrics.netCashFlow >= 0) {
    return HomeFinancialPulseState.POSITIVE;
  }
  return HomeFinancialPulseState.NEGATIVE;
}

/**
 * Period movement context: signed net cash flow with meaning, never as a
 * second hero and never as a danger/warning treatment for a negative result.
 */
export function HomeMovementStrip({
  metrics,
  currency,
  locale,
  period,
}: {
  metrics: HomeFinancialMetrics | null;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
}) {
  const t = useTranslations("home");
  const state = resolveHomeFinancialPulseState(metrics);
  const comparison = metrics?.netCashFlowComparison ?? null;

  return (
    <div
      role="group"
      aria-label={t(`financialPulse.netLabel.${period}`)}
      data-testid={HOME_TEST_ID.MOVEMENT}
      className="flex flex-row items-center gap-(--space-3)"
    >
      <FinancialDeltaBadge direction={NET_DELTA_DIRECTION[state]} />
      <div className="min-w-0 flex-1">
        <Text size="sm" tone="secondary">
          {t(`financialPulse.netLabel.${period}`)}
        </Text>
        <div className="mt-(--space-1) flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
          {metrics ? (
            <FinancialDeltaValue direction={NET_DELTA_DIRECTION[state]}>
              {formatCurrency(metrics.netCashFlow, currency, locale, {
                maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
              })}
            </FinancialDeltaValue>
          ) : (
            <Text size="lg" weight="semibold" tabular>
              {t("common.unavailable")}
            </Text>
          )}
          <StatusBadge
            className="min-h-6 rounded-(--radius-control) px-(--space-2) font-medium"
            tone={NET_STATUS_BADGE_TONE[state]}
            data-testid={HOME_TEST_ID.FINANCIAL_PULSE_NET_STATUS}
          >
            {t(`financialPulse.status.${state}`)}
          </StatusBadge>
          {comparison ? (
            <Text size="xs" tone="secondary" className="tabular-nums">
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
  );
}
