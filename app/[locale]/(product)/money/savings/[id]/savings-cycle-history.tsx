"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SavingCycle } from "@/modules/savings/application/savings-types";
import { motionTokens, springs } from "@/shared/motion";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/shared/i18n/formatters";
import { Text } from "@/shared/ui/text";

type Props = { cycles: SavingCycle[]; currency: string };

function isoDate(value: string, locale: string) {
  return formatDate(new Date(`${value}T12:00:00`), locale);
}

export function SavingsCycleHistory({ cycles, currency }: Props) {
  const t = useTranslations("money.savingsDetail");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul
      className="divide-y divide-border-subtle/70"
      data-testid="savings-cycle-history-list"
    >
      {cycles.map((cycle) => {
        const result = cycle.settlementResult;
        const realizedInterest =
          result?.netInterest ?? result?.interestReturned ?? 0;
        const realizedTax = result?.tax ?? 0;
        const expanded = expandedId === cycle.id;
        return (
          <li
            key={cycle.id}
            className="py-(--space-3)"
            data-testid={`savings-cycle-row-${cycle.id}`}
          >
            <button
              type="button"
              className="flex min-h-11 w-full items-start justify-between gap-(--space-3) text-left focus-visible:outline-2 focus-visible:outline-focus-ring"
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
                  {formatCurrency(cycle.principal, currency, locale, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  · {isoDate(cycle.startDate, locale)} →{" "}
                  {isoDate(cycle.endDate, locale)}
                </Text>
                {result && realizedInterest > 0 ? (
                  <Text size="xs" tone="secondary" className="mt-(--space-1)">
                    {t("realizedInterest", {
                      amount: formatCurrency(
                        realizedInterest,
                        currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                    })}
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
              <span className="shrink-0 text-xs font-medium text-accent">
                {expanded ? t("collapse") : t("details")}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: motionTokens.distance.xs }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -motionTokens.distance.xs }}
                  transition={springs.gentle}
                  className="mt-(--space-3) border-l-2 border-accent/30 pl-(--space-3)"
                >
                  <Text size="xs" tone="secondary">
                    {t("snapshotLabel")}
                  </Text>
                  <div className="mt-(--space-2) grid gap-(--space-2)">
                    <Text size="sm">
                      {t("snapshotProduct", {
                        product: cycle.packageSnapshot.packageName,
                      })}
                    </Text>
                    <Text size="sm">
                      {t("snapshotRate", {
                        rate: formatPercent(cycle.lockedRate / 100, locale, {
                          maximumFractionDigits: 2,
                        }),
                      })}
                    </Text>
                    <Text size="sm">
                      {t("snapshotPrincipal", {
                        amount: formatCurrency(
                          cycle.principal,
                          currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        ),
                      })}
                    </Text>
                    {result ? (
                      <>
                        <Text size="sm">
                          {t("realizedInterest", {
                            amount: formatCurrency(
                              realizedInterest,
                              currency,
                              locale,
                              { maximumFractionDigits: 0 },
                            ),
                          })}
                        </Text>
                        {realizedTax > 0 ? (
                          <Text size="sm">
                            {t("realizedTax", {
                              amount: formatCurrency(
                                realizedTax,
                                currency,
                                locale,
                                { maximumFractionDigits: 0 },
                              ),
                            })}
                          </Text>
                        ) : null}
                        <Text size="sm">
                          {t("finalProceeds", {
                            amount: formatCurrency(
                              result.totalCashReceived ?? result.netAmount,
                              currency,
                              locale,
                              { maximumFractionDigits: 0 },
                            ),
                          })}
                        </Text>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
