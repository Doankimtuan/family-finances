import { Link } from "@/i18n/navigation";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { formatCurrency } from "@/shared/i18n/formatters";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

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
  jarNames: Readonly<Record<string, string>>,
  goalNames: Readonly<Record<string, string>>,
  currency?: string,
  locale?: string,
): Record<string, string | number> {
  const reason = recommendation.reason;
  const jarId =
    recommendation.entityType === "jar" ? recommendation.entityId : undefined;
  const goalId =
    recommendation.entityType === "goal" ? recommendation.entityId : undefined;
  const donorJarId =
    typeof reason.donorJarId === "string" ? reason.donorJarId : undefined;
  const name = jarId
    ? (jarNames[jarId] ?? "Jar")
    : goalId
      ? (goalNames[goalId] ?? "Goal")
      : "";
  return {
    name,
    donorName: donorJarId ? (jarNames[donorJarId] ?? "Jar") : "",
    amount:
      currency && locale
        ? formatCurrency(recommendation.amount ?? 0, currency, locale, {
            maximumFractionDigits: 0,
          })
        : (recommendation.amount ?? 0),
    count: typeof reason.count === "number" ? reason.count : 0,
    percent: typeof reason.usagePercent === "number" ? reason.usagePercent : 0,
    days: typeof reason.daysRemaining === "number" ? reason.daysRemaining : 0,
    expected:
      currency && locale && typeof reason.expectedAmount === "number"
        ? formatCurrency(reason.expectedAmount, currency, locale, {
            maximumFractionDigits: 0,
          })
        : typeof reason.expectedAmount === "number"
          ? reason.expectedAmount
          : 0,
    actual:
      currency && locale && typeof reason.actualAmount === "number"
        ? formatCurrency(reason.actualAmount, currency, locale, {
            maximumFractionDigits: 0,
          })
        : typeof reason.actualAmount === "number"
          ? reason.actualAmount
          : 0,
  };
}

function actionLabel(
  recommendation: PlanRecommendation,
  t: Translator,
): string {
  const actionType = recommendation.action?.type;
  switch (actionType) {
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
}: Props) {
  if (recommendations.length === 0) return null;
  return (
    <Section title={title ?? t("recommendations.title")} testId={testId}>
      <ul className="flex flex-col gap-(--space-2)">
        {recommendations.map((recommendation) => {
          const values = recommendationValues(
            recommendation,
            jarNames,
            goalNames,
          );
          return (
            <li key={recommendation.id}>
              <div className="flex items-start justify-between gap-(--space-3) rounded-[var(--radius-card)] border border-accent/20 bg-accent/5 p-(--space-3)">
                <div className="min-w-0">
                  <Text
                    size="sm"
                    className="font-semibold text-text-primary text-wrap-balance"
                  >
                    {t(recommendation.titleKey, values)}
                  </Text>
                  <Text
                    size="sm"
                    tone="secondary"
                    className="mt-1 text-wrap-pretty"
                  >
                    {t(recommendation.descriptionKey, values)}
                  </Text>
                </div>
                {recommendation.action ? (
                  <Link
                    href={resolveHref(recommendation)}
                    className="min-h-10 shrink-0 rounded-[var(--radius-control)] px-(--space-2) text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {actionLabel(recommendation, t)}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
