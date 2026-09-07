"use client";

import type { ReactNode } from "react";
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
  Balance,
  BalanceSize,
  Card,
  FinancialDeltaBadge,
  FinancialDeltaDirection,
  FinancialDeltaValue,
} from "@/shared/patterns";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";

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
 * Financial pulse: a deep-teal brand hero answers "how much do we have" with
 * the period control integrated, then a compact strip answers flow direction
 * with signed financial color on a neutral surface. Negative flow is a
 * signed result, not an actionable danger state.
 */
export function HomeFinancialPulse({
  balance,
  balanceNote,
  currency,
  locale,
  period,
  metrics,
  periodControl,
}: {
  balance: number | null;
  balanceNote?: string;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
  metrics: HomeFinancialMetrics | null;
  periodControl?: ReactNode;
}) {
  const t = useTranslations("home");
  const state = resolveHomeFinancialPulseState(metrics);
  const comparison = metrics?.netCashFlowComparison ?? null;

  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card
        tone="hero"
        className="gap-0 p-(--space-4)"
        data-testid={HOME_TEST_ID.FINANCIAL_PULSE}
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="sm" weight="medium" className="text-hero-muted">
            {t("financialPulse.title")}
          </Text>
          <FinancialPrivacyToggle
            hideLabel={t("financialPrivacy.hide")}
            showLabel={t("financialPrivacy.show")}
            testId={HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE}
          />
        </div>
        <div
          className="mt-(--space-2)"
          role="group"
          aria-label={t("financialPulse.accessibleLabel")}
        >
          {balance == null ? (
            <Text size="lg" weight="semibold" className="text-hero-fg">
              {t("financialPulse.unavailable")}
            </Text>
          ) : (
            <Balance
              amountLabel={formatCurrency(balance, currency, locale, {
                maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
              })}
              size={BalanceSize.HERO}
              amountClassName="text-hero-fg"
            />
          )}
          {balanceNote ? (
            <Text size="xs" className="mt-(--space-1) text-hero-muted">
              {balanceNote}
            </Text>
          ) : null}
        </div>
        {periodControl ? (
          <div className="mt-(--space-4) border-t border-white/15 pt-(--space-3)">
            {periodControl}
          </div>
        ) : null}
      </Card>

      <div role="group" aria-label={t(`financialPulse.netLabel.${period}`)}>
        <Card
          tone="elevated"
          className="flex flex-row items-center gap-(--space-3) p-(--space-3)"
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
        </Card>
      </div>
    </div>
  );
}
