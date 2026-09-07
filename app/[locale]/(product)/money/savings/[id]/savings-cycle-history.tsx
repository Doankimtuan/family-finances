"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SavingCycle } from "@/modules/savings/application/savings-types";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/shared/i18n/formatters";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { cn } from "@/shared/utils/cn";
import { SavingsFactRow } from "../savings-facts";

type Props = { cycles: SavingCycle[]; currency: string };

function isoDate(value: string, locale: string) {
  return formatDate(new Date(`${value}T12:00:00`), locale);
}

function CycleSnapshotCard({
  cycle,
  currency,
  locale,
}: {
  cycle: SavingCycle;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("money.savingsDetail");
  const result = cycle.settlementResult;
  const realizedInterest = result?.netInterest ?? result?.interestReturned ?? 0;
  const realizedTax = result?.tax ?? 0;

  return (
    <Card tone="soft" className="gap-0 overflow-hidden p-0">
      <Text
        size="xs"
        tone="secondary"
        className="px-(--space-4) pt-(--space-3)"
      >
        {t("snapshotLabel")}
      </Text>
      <dl>
        <SavingsFactRow
          label={t("packageLabel")}
          value={cycle.packageSnapshot.packageName}
          className="py-(--space-2)"
        />
        <SavingsFactRow
          label={t("rateLabel")}
          value={formatPercent(cycle.lockedRate / 100, locale, {
            maximumFractionDigits: 2,
          })}
          className="py-(--space-2)"
        />
        <SavingsFactRow
          label={t("snapshotPrincipalLabel")}
          value={
            <FinancialValue>
              {formatCurrency(cycle.principal, currency, locale, {
                maximumFractionDigits: 0,
              })}
            </FinancialValue>
          }
          className="py-(--space-2)"
        />
        {result ? (
          <>
            <SavingsFactRow
              label={t("realizedInterestLabel")}
              value={
                <FinancialValue>
                  {formatCurrency(realizedInterest, currency, locale, {
                    maximumFractionDigits: 0,
                  })}
                </FinancialValue>
              }
              className="py-(--space-2)"
            />
            {realizedTax > 0 ? (
              <SavingsFactRow
                label={t("realizedTaxLabel")}
                value={
                  <FinancialValue>
                    {formatCurrency(realizedTax, currency, locale, {
                      maximumFractionDigits: 0,
                    })}
                  </FinancialValue>
                }
                className="py-(--space-2)"
              />
            ) : null}
            <SavingsFactRow
              label={t("finalProceedsLabel")}
              value={
                <FinancialValue>
                  {formatCurrency(
                    result.totalCashReceived ?? result.netAmount,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                </FinancialValue>
              }
              emphasis
              className="py-(--space-2)"
            />
          </>
        ) : null}
      </dl>
    </Card>
  );
}

function CycleHistoryDetailsPanel({
  motionEnabled,
  expanded,
  testId,
  children,
}: {
  motionEnabled: boolean;
  expanded: boolean;
  testId: string;
  children: ReactNode;
}) {
  if (!motionEnabled) {
    return expanded ? (
      <div
        className="mt-(--space-3)"
        data-testid={testId}
        data-motion-enabled="false"
      >
        {children}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence initial={false}>
      {expanded ? (
        <motion.div
          key="details"
          initial={{ opacity: 0, y: motionTokens.distance.xs }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -motionTokens.distance.xs }}
          transition={springs.gentle}
          className="mt-(--space-3)"
          data-testid={testId}
          data-motion-enabled="true"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SavingsCycleHistory({ cycles, currency }: Props) {
  const t = useTranslations("money.savingsDetail");
  const locale = useLocale();
  const motionPolicy = useMotionPolicy();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul
      className="divide-y divide-divider"
      data-testid="savings-cycle-history-list"
    >
      {cycles.map((cycle) => {
        const result = cycle.settlementResult;
        const realizedInterest =
          result?.netInterest ?? result?.interestReturned ?? 0;
        const expanded = expandedId === cycle.id;
        const detailsTestId = `savings-cycle-details-${cycle.id}`;
        return (
          <li
            key={cycle.id}
            className="py-(--space-3) first:pt-0 last:pb-0"
            data-testid={`savings-cycle-row-${cycle.id}`}
          >
            <button
              type="button"
              className="flex min-h-11 w-full items-start justify-between gap-(--space-3) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-expanded={expanded}
              onClick={() => setExpandedId(expanded ? null : cycle.id)}
            >
              <span className="min-w-0">
                <Text size="sm" weight="semibold">
                  {t("cycleLabel", { number: cycle.cycleNumber })} ·{" "}
                  {t(`cycleStatus.${cycle.status}` as never)}
                </Text>
                <Text size="xs" tone="secondary" className="mt-(--space-1)">
                  {cycle.packageSnapshot.packageName} ·{" "}
                  {formatPercent(cycle.lockedRate / 100, locale, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  / {t("year")}
                </Text>
                <Text size="xs" tone="secondary" className="mt-(--space-1)">
                  <FinancialValue>
                    {formatCurrency(cycle.principal, currency, locale, {
                      maximumFractionDigits: 0,
                    })}
                  </FinancialValue>{" "}
                  · {isoDate(cycle.startDate, locale)} →{" "}
                  {isoDate(cycle.endDate, locale)}
                </Text>
                {result && realizedInterest > 0 ? (
                  <Text size="xs" tone="secondary" className="mt-(--space-1)">
                    {t("realizedInterestLabel")}{" "}
                    <FinancialValue>
                      {formatCurrency(realizedInterest, currency, locale, {
                        maximumFractionDigits: 0,
                      })}
                    </FinancialValue>
                  </Text>
                ) : null}
                {cycle.nextCycleId ? (
                  <Text size="xs" tone="secondary" className="mt-(--space-1)">
                    {t("rolloverLine", {
                      package: cycle.packageSnapshot.packageName,
                    })}
                  </Text>
                ) : null}
              </span>
              <span className="inline-flex shrink-0 items-center pt-(--space-1)">
                <span className="sr-only">
                  {expanded ? t("collapse") : t("details")}
                </span>
                <AppIcon
                  icon={ACTION_ICONS.forward}
                  size={AppIconSize.SM}
                  className={cn(
                    "text-text-tertiary",
                    motionPolicy.enabled &&
                      "transition-transform duration-(--duration-fast) ease-(--ease-standard)",
                    expanded && "rotate-90",
                  )}
                />
              </span>
            </button>
            <CycleHistoryDetailsPanel
              motionEnabled={motionPolicy.enabled}
              expanded={expanded}
              testId={detailsTestId}
            >
              <CycleSnapshotCard
                cycle={cycle}
                currency={currency}
                locale={locale}
              />
            </CycleHistoryDetailsPanel>
          </li>
        );
      })}
    </ul>
  );
}
