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
  Card,
  FinancialDeltaBadge,
  FinancialDeltaDirection,
  FinancialDeltaValue,
} from "@/shared/patterns";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconButton } from "@/shared/ui/icon-button";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { AnimatePresence, motion } from "motion/react";
import { motionTokens, useMotionPolicy } from "@/shared/motion";

const NET_DELTA_DIRECTION: Record<
  HomeFinancialPulseState,
  FinancialDeltaDirection
> = {
  [HomeFinancialPulseState.POSITIVE]: FinancialDeltaDirection.POSITIVE,
  [HomeFinancialPulseState.ATTENTION]: FinancialDeltaDirection.NEGATIVE,
  [HomeFinancialPulseState.UNAVAILABLE]: FinancialDeltaDirection.NEUTRAL,
};

const NET_STATUS_BADGE_TONE = {
  [HomeFinancialPulseState.POSITIVE]: "positive",
  [HomeFinancialPulseState.ATTENTION]: "attention",
  [HomeFinancialPulseState.UNAVAILABLE]: "neutral",
} as const;

function HomeFinancialPrivacyToggle() {
  const t = useTranslations("home");
  const { isHidden, toggle } = useFinancialPrivacy();
  const policy = useMotionPolicy({ essential: true });
  const label = t(isHidden ? "financialPrivacy.show" : "financialPrivacy.hide");
  const swapScale = policy.reducedMotion ? 1 : motionTokens.scale.subtle;

  return (
    <IconButton
      aria-label={label}
      aria-pressed={isHidden}
      data-testid={HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE}
      onPress={toggle}
      variant="tertiary"
      className="border border-white/25 bg-white/10 text-hero-fg shadow-none hover:bg-white/20 focus-visible:outline-hero-fg disabled:opacity-50"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isHidden ? "hidden" : "visible"}
          className="inline-flex items-center justify-center"
          initial={{ opacity: 0, scale: swapScale }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: swapScale }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.easing.standard,
          }}
        >
          <AppIcon
            icon={
              isHidden
                ? UTILITY_ICONS.financialHidden
                : UTILITY_ICONS.financialVisible
            }
            size={AppIconSize.MD}
          />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}

/**
 * Financial pulse: a deep-teal brand hero answers "how much do we have" with
 * the period control integrated, then a compact strip answers flow direction
 * with semantic color on a neutral surface where status tokens keep contrast.
 */
export function HomeFinancialPulse({
  balance,
  currency,
  locale,
  period,
  metrics,
  periodControl,
}: {
  balance: number;
  currency: string;
  locale: string;
  period: HomeDashboardPeriod;
  metrics: HomeFinancialMetrics | null;
  periodControl?: ReactNode;
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
          <HomeFinancialPrivacyToggle />
        </div>
        <div
          className="mt-(--space-2)"
          role="group"
          aria-label={t("financialPulse.accessibleLabel")}
        >
          <Balance
            amountLabel={formatCurrency(balance, currency, locale, {
              maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
            })}
            size="hero"
            amountClassName="text-4xl text-hero-fg"
          />
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
