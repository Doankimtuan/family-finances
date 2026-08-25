import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";

export type Translator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<
      string,
      string | number | ((chunks: ReactNode) => ReactNode)
    >,
  ) => ReactNode;
};

function localizedAmount(
  amount: number,
  currency: string | undefined,
  locale: string | undefined,
): string {
  return currency && locale
    ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
    : "—";
}

type Props = {
  recommendations: readonly PlanRecommendation[];
  t: Translator;
  resolveHref: (recommendation: PlanRecommendation) => string;
  jarNames?: Readonly<Record<string, string>>;
  goalNames?: Readonly<Record<string, string>>;
  title?: string;
  testId: string;
  currency?: string;
  locale?: string;
};

function recommendationValues(
  recommendation: PlanRecommendation,
  t: Translator,
  jarNames: Readonly<Record<string, string>>,
  goalNames: Readonly<Record<string, string>>,
  currency?: string,
  locale?: string,
): Record<string, string | number | ((chunks: ReactNode) => ReactNode)> {
  const reason = recommendation.reason;
  const jarId =
    recommendation.entityType === "jar" ? recommendation.entityId : undefined;
  const goalId =
    recommendation.entityType === "goal" ? recommendation.entityId : undefined;
  const donorJarId =
    typeof reason.donorJarId === "string" ? reason.donorJarId : undefined;
  const name = jarId
    ? (jarNames[jarId] ?? t("recommendations.unknownJar"))
    : goalId
      ? (goalNames[goalId] ?? t("recommendations.unknownGoal"))
      : "";
  return {
    name,
    donorName: donorJarId
      ? (jarNames[donorJarId] ?? t("recommendations.unknownJar"))
      : "",
    amount: localizedAmount(recommendation.amount ?? 0, currency, locale),
    money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    count: typeof reason.count === "number" ? reason.count : 0,
    percent: typeof reason.usagePercent === "number" ? reason.usagePercent : 0,
    days: typeof reason.daysRemaining === "number" ? reason.daysRemaining : 0,
    expected: localizedAmount(
      typeof reason.expectedAmount === "number" ? reason.expectedAmount : 0,
      currency,
      locale,
    ),
    actual: localizedAmount(
      typeof reason.actualAmount === "number" ? reason.actualAmount : 0,
      currency,
      locale,
    ),
    moneyExpected: (chunks: ReactNode) => (
      <FinancialValue>{chunks}</FinancialValue>
    ),
    moneyActual: (chunks: ReactNode) => (
      <FinancialValue>{chunks}</FinancialValue>
    ),
  };
}

function actionLabel(
  recommendation: PlanRecommendation,
  t: Translator,
): string {
  switch (recommendation.action?.type) {
    case "reallocate_jar_budget":
      return t("recommendations.actions.reallocate");
    case "review_transactions":
      return t("recommendations.actions.reviewTransactions");
    case "plan_settings":
      return t("recommendations.actions.planSettings");
    case "goal_funding_sources":
      return t("recommendations.actions.goalFunding");
    case "investment_detail":
      return t("recommendations.actions.openInvestment");
    case "recurring_detail":
      return t("recommendations.actions.openRecurring");
    case "review_jar_rule":
      return t("recommendations.actions.reviewJarRule");
    case "goal_detail":
      return t("recommendations.actions.openGoal");
    case "review_jar_budget":
    default:
      return t("recommendations.actions.reviewBudget");
  }
}

export function RecommendationList({
  recommendations,
  t,
  resolveHref,
  jarNames = {},
  goalNames = {},
  title,
  testId,
  currency,
  locale,
}: Props) {
  if (recommendations.length === 0) return null;

  return (
    <Section title={title ?? t("recommendations.title")} testId={testId}>
      <div className="flex flex-col gap-(--space-3)">
        {recommendations.map((recommendation) => {
          const values = recommendationValues(
            recommendation,
            t,
            jarNames,
            goalNames,
            currency,
            locale,
          );
          return (
            <Card
              key={recommendation.id}
              tone="highlighted"
              className="gap-(--space-3) p-(--space-4)"
            >
              <div className="flex items-start justify-between gap-(--space-3)">
                <div className="min-w-0">
                  <StatusBadge tone="info">
                    {t("recommendations.title")}
                  </StatusBadge>
                  <Text
                    size="sm"
                    className="mt-(--space-2) font-semibold text-text-primary text-wrap-balance"
                  >
                    {t.rich(recommendation.titleKey, values)}
                  </Text>
                </div>
                {recommendation.amount != null ? (
                  <Text
                    size="sm"
                    className="shrink-0 tabular-nums font-semibold text-text-primary"
                  >
                    <FinancialValue>
                      {localizedAmount(recommendation.amount, currency, locale)}
                    </FinancialValue>
                  </Text>
                ) : null}
              </div>
              <Text size="sm" tone="secondary" className="text-wrap-pretty">
                {t.rich(recommendation.descriptionKey, values)}
              </Text>
              {recommendation.action ? (
                <Link
                  href={resolveHref(recommendation)}
                  className="inline-flex min-h-10 w-fit items-center rounded-(--radius-control) bg-accent px-(--space-3) text-sm font-semibold text-accent-fg transition-[transform,background-color] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  {actionLabel(recommendation, t)}
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
