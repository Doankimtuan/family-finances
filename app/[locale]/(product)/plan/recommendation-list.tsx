import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { PLAN_INLINE_LINK_CLASS } from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";
import {
  RecommendationListVariant,
  type RecommendationListVariant as RecommendationListVariantValue,
} from "./plan-hub-presentations";

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
  variant?: RecommendationListVariantValue;
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

function RecommendationItem({
  recommendation,
  t,
  resolveHref,
  jarNames,
  goalNames,
  currency,
  locale,
  variant,
}: {
  recommendation: PlanRecommendation;
  t: Translator;
  resolveHref: (recommendation: PlanRecommendation) => string;
  jarNames: Readonly<Record<string, string>>;
  goalNames: Readonly<Record<string, string>>;
  currency?: string;
  locale?: string;
  variant: RecommendationListVariantValue;
}) {
  const values = recommendationValues(
    recommendation,
    t,
    jarNames,
    goalNames,
    currency,
    locale,
  );
  const supporting = variant === RecommendationListVariant.SUPPORTING;

  return (
    <>
      <div className="flex items-start justify-between gap-(--space-3)">
        <Text
          size="sm"
          weight={supporting ? "medium" : "semibold"}
          className="min-w-0 text-pretty text-wrap-balance"
        >
          {t.rich(recommendation.titleKey, values)}
        </Text>
        {recommendation.amount != null ? (
          <Text
            size="sm"
            weight={supporting ? "medium" : "semibold"}
            tabular
            className="shrink-0 tracking-tight"
          >
            <FinancialValue>
              {localizedAmount(recommendation.amount, currency, locale)}
            </FinancialValue>
          </Text>
        ) : null}
      </div>
      <Text size="sm" tone="secondary" className="text-pretty">
        {t.rich(recommendation.descriptionKey, values)}
      </Text>
      {recommendation.action ? (
        <Link
          href={resolveHref(recommendation)}
          prefetch={PRODUCT_LINK_PREFETCH}
          className={`${PLAN_INLINE_LINK_CLASS} w-fit gap-(--space-1)`}
        >
          {actionLabel(recommendation, t)}
          <AppIcon icon={ACTION_ICONS.forward} size="sm" />
        </Link>
      ) : null}
    </>
  );
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
  variant = RecommendationListVariant.HIGHLIGHTED,
}: Props) {
  if (recommendations.length === 0) return null;

  const supporting = variant === RecommendationListVariant.SUPPORTING;

  return (
    <Section
      title={
        <PlanSectionTitle>
          {title ?? t("recommendations.title")}
        </PlanSectionTitle>
      }
      testId={testId}
    >
      {supporting ? (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <ul className="divide-y divide-divider">
            {recommendations.map((recommendation) => (
              <li
                key={recommendation.id}
                className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)"
              >
                <RecommendationItem
                  recommendation={recommendation}
                  t={t}
                  resolveHref={resolveHref}
                  jarNames={jarNames}
                  goalNames={goalNames}
                  currency={currency}
                  locale={locale}
                  variant={RecommendationListVariant.SUPPORTING}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <div className="flex flex-col gap-(--space-2)">
          {recommendations.map((recommendation) => (
            <Card
              key={recommendation.id}
              tone="highlighted"
              className="gap-(--space-3) p-(--space-4)"
            >
              <RecommendationItem
                recommendation={recommendation}
                t={t}
                resolveHref={resolveHref}
                jarNames={jarNames}
                goalNames={goalNames}
                currency={currency}
                locale={locale}
                variant={RecommendationListVariant.HIGHLIGHTED}
              />
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
