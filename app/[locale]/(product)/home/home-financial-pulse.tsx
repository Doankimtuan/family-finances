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
import { Balance } from "@/shared/patterns/balance";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconButton } from "@/shared/ui/icon-button";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";

function HomeFinancialPrivacyToggle() {
  const t = useTranslations("home");
  const { isHidden, toggle } = useFinancialPrivacy();
  const label = t(isHidden ? "financialPrivacy.show" : "financialPrivacy.hide");

  return (
    <IconButton
      aria-label={label}
      aria-pressed={isHidden}
      data-testid={HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE}
      onPress={toggle}
      variant="tertiary"
    >
      <AppIcon
        icon={
          isHidden
            ? UTILITY_ICONS.financialHidden
            : UTILITY_ICONS.financialVisible
        }
        size={AppIconSize.MD}
      />
    </IconButton>
  );
}

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
      ? HomeFinancialPulseState.UNAVAILABLE
      : metrics.netCashFlow >= 0
        ? HomeFinancialPulseState.POSITIVE
        : HomeFinancialPulseState.ATTENTION;
  const comparison = metrics?.netCashFlowComparison ?? null;

  return (
    <KpiBlock
      title={t("financialPulse.title")}
      variant="prominent"
      className="border-accent/15 bg-surface-highlight/55 shadow-(--elevation-1) mb-3"
      data-testid={HOME_TEST_ID.FINANCIAL_PULSE}
    >
      <div className="flex flex-col gap-(--space-4)">
        <div
          className="min-w-0"
          role="group"
          aria-label={t("financialPulse.accessibleLabel")}
        >
          <div className="flex items-start justify-between gap-(--space-3)">
            <Balance
              amountLabel={formatCurrency(balance, currency, locale, {
                maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
              })}
              size="hero"
            />
            <HomeFinancialPrivacyToggle />
          </div>
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-2) max-w-(--subtitle-max-width) text-pretty"
          >
            {t("financialPulse.hint")}
          </Text>
          {action ? (
            <div className="mt-(--space-3) self-start">{action}</div>
          ) : null}
        </div>
        <div
          className="border-t border-border-subtle pt-(--space-3)"
          role="group"
          aria-label={t(`financialPulse.netLabel.${period}`)}
        >
          <Text size="sm" tone="secondary">
            {t(`financialPulse.netLabel.${period}`)}
          </Text>
          <Text
            size="lg"
            className="mt-(--space-1) font-semibold tabular-nums text-text-primary"
          >
            {metrics ? (
              <FinancialValue>
                {formatCurrency(metrics.netCashFlow, currency, locale, {
                  maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                })}
              </FinancialValue>
            ) : (
              t("common.unavailable")
            )}
          </Text>
          <div className="mt-(--space-1) flex flex-wrap items-center gap-(--space-2)">
            <StatusBadge
              className="min-h-6 rounded-(--radius-control) bg-transparent px-0 font-medium"
              tone={
                state === HomeFinancialPulseState.POSITIVE
                  ? "positive"
                  : state === HomeFinancialPulseState.ATTENTION
                    ? "attention"
                    : "neutral"
              }
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
    </KpiBlock>
  );
}
