import type { ReactNode } from "react";
import {
  JarBudgetState,
  JarKind,
  JarState,
  QualifyingIncomeSource,
  type JarKind as JarKindValue,
  type JarState as JarStateValue,
} from "@/modules/plan/application/plan-constants";
import type { JarBudgetMetrics } from "@/modules/plan/application/jar-budget";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { IconContainerTone } from "@/shared/ui/icon-container";

export const JAR_KIND_ICON_TONE: Record<JarKindValue, IconContainerTone> = {
  [JarKind.SPENDING]: IconContainerTone.EXPENSE,
  [JarKind.SAVINGS]: IconContainerTone.SAVINGS,
  [JarKind.BUFFER]: IconContainerTone.INFO,
  [JarKind.INCOME]: IconContainerTone.INCOME,
};

const JAR_STATE_LABEL_KEY = {
  [JarState.PAUSED]: "statePaused",
  [JarState.ARCHIVED]: "stateArchived",
  [JarState.ACTIVE]: "stateActive",
} as const;

type JarPlanTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<string, string | ((chunks: ReactNode) => ReactNode)>,
  ) => ReactNode;
};

export function jarStateLabelKey(state: JarStateValue) {
  return JAR_STATE_LABEL_KEY[state];
}

export function isJarBudgetOverspent(metrics: JarBudgetMetrics | undefined) {
  return metrics?.state === JarBudgetState.OVERSPENT;
}

export function isJarBudgetNoIncome(metrics: JarBudgetMetrics | undefined) {
  return (
    metrics?.state === JarBudgetState.NO_BUDGET &&
    metrics.incomeSource === QualifyingIncomeSource.NONE
  );
}

export function jarBudgetProgressPercent(
  metrics: JarBudgetMetrics | undefined,
): number | undefined {
  if (!metrics) return undefined;
  if (metrics.state === JarBudgetState.NO_BUDGET) return undefined;
  return metrics.usagePercent;
}

export function jarIntentionRemainingLabel(
  metrics: JarBudgetMetrics | undefined,
  t: JarPlanTranslator,
  currency: string,
  locale: string,
): ReactNode | null {
  if (!metrics) return null;
  if (isJarBudgetNoIncome(metrics)) return null;
  if (metrics.state === JarBudgetState.NO_BUDGET) return null;
  if (metrics.state === JarBudgetState.OVERSPENT) {
    return t.rich("budget.overBy", {
      amount: formatCurrency(
        Math.abs(metrics.remainingAmount),
        currency,
        locale,
        { maximumFractionDigits: 0 },
      ),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  return t.rich("budget.remaining", {
    amount: formatCurrency(metrics.remainingAmount, currency, locale, {
      maximumFractionDigits: 0,
    }),
    money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
  });
}
