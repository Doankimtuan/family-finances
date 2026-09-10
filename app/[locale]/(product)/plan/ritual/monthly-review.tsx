import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Progress } from "@/shared/ui/progress";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import {
  APP_PATH,
  planGoalPath,
  planJarPath,
  planRecurringPath,
  planRitualPath,
} from "@/modules/tenancy/application/app-path";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { JarBudgetState } from "@/modules/plan/application/plan-constants";
import { RecommendationList, type Translator } from "../recommendation-list";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";
import { MonthlyReviewActions } from "./monthly-review-actions";
import { PLAN_SURFACE_LINK_CLASS } from "../plan-chrome";
import { PlanSectionTitle } from "../plan-section-title";
import { shiftPeriodMonth } from "../calendar/calendar-navigation";
import {
  countJarAttention,
  goalBackingCopyKey,
  isAssistedReview,
  isMonthlyReviewEmpty,
  isReviewMarked,
  MONTHLY_REVIEW_CASH_FLOW_FACTS,
} from "./ritual-presentations";

type Props = { review: MonthlyReview };

function moneyLeaf(amountLabel: string, kind: FinancialNumberKind): ReactNode {
  return (
    <FinancialValue>
      <span data-financial-kind={kind}>{amountLabel}</span>
    </FinancialValue>
  );
}

export function MonthlyReviewReport({ review }: Props) {
  const t = useTranslations("plan.monthlyReview");
  const tPlan = useTranslations("plan");
  const locale = useLocale();
  const money = (value: number) =>
    formatCurrency(value, review.currency, locale, {
      maximumFractionDigits: 0,
    });
  const monthLabel = formatDate(
    new Date(`${review.periodMonth}T00:00:00.000Z`),
    locale,
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
  const previousMonth = shiftPeriodMonth(review.periodMonth, -1);
  const nextMonth = shiftPeriodMonth(review.periodMonth, 1);
  const canGoNext = nextMonth <= review.currentPeriodMonth;
  const jarAttentionCount = countJarAttention(review.jars);
  const markedReviewed = isReviewMarked(review.review.state);
  const isEmpty = isMonthlyReviewEmpty(review);
  const hasIssues = review.issues.length > 0;

  const jarNames = Object.fromEntries(
    review.jars.map((jar) => [jar.id, jar.name]),
  );
  const goalNames = Object.fromEntries(
    review.goals.map((goal) => [goal.id, goal.name]),
  );
  const recommendationHref = (recommendation: PlanRecommendation) => {
    const action = recommendation.action;
    if (!action) return APP_PATH.PLAN;
    if (action.type === "review_transactions")
      return APP_PATH.MONEY_TRANSACTIONS;
    if (action.type === "plan_settings") return APP_PATH.PLAN;
    if (action.entityType === "goal" && action.entityId)
      return planGoalPath(action.entityId);
    if (action.entityType === "jar" && action.entityId)
      return planJarPath(action.entityId);
    if (action.entityType === "recurring" && action.entityId)
      return planRecurringPath(action.entityId);
    return APP_PATH.PLAN;
  };

  const issueHref = (kind: MonthlyReview["issues"][number]["kind"]) => {
    if (kind === "uncategorized") return APP_PATH.MONEY_TRANSACTIONS;
    if (kind === "goal_backing") return APP_PATH.PLAN_GOALS;
    return APP_PATH.PLAN_JARS;
  };

  const issueTitle = (issue: MonthlyReview["issues"][number]) => {
    if (issue.kind === "uncategorized") {
      return t("uncategorized", { count: issue.value ?? 0 });
    }
    if (issue.kind === "overspent_jar") {
      return t.rich("overspentJar", {
        name: issue.name ?? "",
        amount: money(issue.value ?? 0),
        money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
      });
    }
    if (issue.kind === "goal_backing") {
      return t("goalBacking", { name: issue.name ?? "" });
    }
    return t("missingIncome");
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="monthly-review-report"
    >
      <Card
        tone="elevated"
        className="gap-(--space-4) p-(--space-4)"
        data-testid="monthly-review-context"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text
              size="xs"
              tone="muted"
              className="uppercase tracking-[0.14em]"
            >
              {t("periodLabel")}
            </Text>
            <p className="mt-(--space-1) text-lg font-semibold tracking-tight text-text-primary">
              {monthLabel}
            </p>
            <Text size="sm" tone="secondary" className="mt-(--space-1)">
              {review.isCurrentPeriod ? t("inProgress") : t("subtitle")}
            </Text>
          </div>
          <StatusBadge
            tone={
              markedReviewed
                ? StatusBadgeTone.POSITIVE
                : StatusBadgeTone.WARNING
            }
          >
            {markedReviewed ? t("reviewed") : t("notReviewed")}
          </StatusBadge>
        </div>
        <div className="flex items-center justify-between gap-(--space-2)">
          <Link
            href={planRitualPath(previousMonth)}
            className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-3) text-sm font-medium text-accent transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
            data-testid="monthly-review-previous"
          >
            {t("previousMonth")}
          </Link>
          <Text size="sm" tone="muted">
            {review.isCurrentPeriod ? t("currentMonth") : t("historicalMonth")}
          </Text>
          {canGoNext ? (
            <Link
              href={planRitualPath(nextMonth)}
              className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-3) text-sm font-medium text-accent transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
              data-testid="monthly-review-next"
            >
              {t("nextMonth")}
            </Link>
          ) : (
            <span className="min-w-20" aria-hidden="true" />
          )}
        </div>
      </Card>

      {review.review.updatedAfterReview ? (
        <StatusAlert
          variant="info"
          title={t("updatedAfterReviewTitle")}
          description={t("updatedAfterReviewBody")}
        />
      ) : null}

      <Card
        tone="soft"
        className="gap-(--space-2) p-(--space-4)"
        data-testid="monthly-review-question"
      >
        <Text size="sm" weight="semibold">
          {hasIssues ? t("questionIssuesTitle") : t("questionReadyTitle")}
        </Text>
        <Text size="sm" tone="secondary" className="text-pretty">
          {hasIssues ? t("questionIssuesBody") : t("questionReadyBody")}
        </Text>
      </Card>

      {hasIssues ? (
        <Section
          title={<PlanSectionTitle>{t("issuesHeading")}</PlanSectionTitle>}
          testId="monthly-review-issues"
        >
          <div className="flex flex-col gap-2">
            {review.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-warning/20 bg-warning/10 px-(--space-3) py-(--space-3)"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-pretty text-text-primary">
                    {issueTitle(issue)}
                  </p>
                  <Text size="sm" tone="secondary">
                    {t("reviewWithoutBlocking")}
                  </Text>
                </div>
                <Link
                  href={issueHref(issue.kind)}
                  className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent"
                >
                  {t("open")}
                </Link>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        title={<PlanSectionTitle>{t("summaryHeading")}</PlanSectionTitle>}
        testId="monthly-review-cash-flow"
      >
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <dl className="divide-y divide-border-subtle/65 py-(--space-1)">
            {MONTHLY_REVIEW_CASH_FLOW_FACTS.map((fact) => {
              const value = review.cashFlow[fact.field];
              const signed =
                fact.field === "netCashFlow" && value >= 0
                  ? `+${money(value)}`
                  : money(value);
              return (
                <div
                  key={fact.key}
                  className="flex min-h-14 items-center justify-between gap-(--space-3) px-(--space-4) py-(--space-2)"
                >
                  <dt>
                    <Text size="sm" tone="secondary">
                      {t(fact.key)}
                    </Text>
                  </dt>
                  <dd
                    className={`text-sm font-semibold tabular-nums ${
                      fact.field === "netCashFlow" && value < 0
                        ? "text-danger"
                        : "text-text-primary"
                    }`}
                  >
                    {moneyLeaf(signed, fact.kind)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>
        <Text size="sm" tone="secondary">
          {t("summaryNote")}
        </Text>
      </Section>

      <Section
        title={<PlanSectionTitle>{t("jarsHeading")}</PlanSectionTitle>}
        action={
          <Text size="sm" tone="secondary">
            {t("jarsAttention", { count: jarAttentionCount })}
          </Text>
        }
        testId="monthly-review-jars"
      >
        {review.jars.length === 0 ? (
          <Card tone="soft">
            <Text size="sm" tone="secondary">
              {t("noJars")}
            </Text>
            <Link
              href={APP_PATH.PLAN_JARS}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent"
            >
              {t("setupJars")}
            </Link>
          </Card>
        ) : (
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
              {review.jars.map((jar) => (
                <div
                  key={jar.id}
                  className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)"
                >
                  <div className="flex items-start justify-between gap-(--space-3)">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary">
                        {jar.name}
                      </p>
                      <Text size="sm" tone="secondary">
                        {moneyLeaf(
                          money(jar.spent),
                          FinancialNumberKind.INTENTION,
                        )}{" "}
                        /{" "}
                        {moneyLeaf(
                          money(jar.budget),
                          FinancialNumberKind.INTENTION,
                        )}
                      </Text>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${jar.state === JarBudgetState.OVERSPENT ? "text-danger" : "text-text-secondary"}`}
                    >
                      {moneyLeaf(
                        `${jar.usagePercent}%`,
                        FinancialNumberKind.INTENTION,
                      )}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, jar.usagePercent))}
                    showLabel={false}
                    privacyAware
                    className="mt-(--space-1)"
                    indicatorClassName={
                      jar.state === JarBudgetState.OVERSPENT
                        ? "bg-danger"
                        : undefined
                    }
                  />
                  <Text
                    size="sm"
                    tone={
                      jar.state === JarBudgetState.OVERSPENT
                        ? "danger"
                        : "secondary"
                    }
                  >
                    {jar.remaining >= 0
                      ? t.rich("jarRemaining", {
                          amount: money(jar.remaining),
                          money: (chunks: ReactNode) => (
                            <FinancialValue>{chunks}</FinancialValue>
                          ),
                        })
                      : t.rich("jarOver", {
                          amount: money(Math.abs(jar.remaining)),
                          money: (chunks: ReactNode) => (
                            <FinancialValue>{chunks}</FinancialValue>
                          ),
                        })}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Section>

      {review.goals.length > 0 ? (
        <Section
          title={<PlanSectionTitle>{t("goalsHeading")}</PlanSectionTitle>}
          testId="monthly-review-goals"
        >
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
              {review.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)"
                >
                  <div className="flex items-start justify-between gap-(--space-3)">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary">
                        {goal.name}
                      </p>
                      <Text size="sm" tone="secondary">
                        {t(goalBackingCopyKey(goal.backing))}
                      </Text>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-text-secondary">
                      {goal.progressPercent == null
                        ? t("progressIndeterminate")
                        : moneyLeaf(
                            `${goal.progressPercent}%`,
                            FinancialNumberKind.INTENTION,
                          )}
                    </span>
                  </div>
                  {goal.progressPercent == null ? null : (
                    <Progress
                      value={goal.progressPercent}
                      showLabel={false}
                      privacyAware
                    />
                  )}
                  <Text size="sm" tone="secondary">
                    {moneyLeaf(
                      money(goal.fundedAmount),
                      FinancialNumberKind.INTENTION,
                    )}{" "}
                    /{" "}
                    {moneyLeaf(
                      money(goal.targetAmount),
                      FinancialNumberKind.INTENTION,
                    )}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      ) : null}

      {review.changes.length > 0 ? (
        <Section
          title={<PlanSectionTitle>{t("changesHeading")}</PlanSectionTitle>}
          testId="monthly-review-changes"
        >
          <div className="flex flex-col gap-2">
            {review.changes.map((change) => (
              <div
                key={change.id}
                className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-control)] bg-surface-muted/60 px-(--space-3) py-(--space-3)"
              >
                <span className="text-sm text-text-primary">
                  {t(`changeLabels.${change.label}`)}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${change.direction === "up" ? "text-danger" : "text-success"}`}
                >
                  {moneyLeaf(
                    `${change.amount >= 0 ? "+" : ""}${money(change.amount)}`,
                    FinancialNumberKind.MOVEMENT,
                  )}
                  {change.percent == null
                    ? ""
                    : ` (${change.percent >= 0 ? "+" : ""}${change.percent}%)`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {isAssistedReview(review.assistMode) ? (
        <RecommendationList
          recommendations={review.recommendations}
          t={tPlan as unknown as Translator}
          resolveHref={recommendationHref}
          jarNames={jarNames}
          goalNames={goalNames}
          currency={review.currency}
          locale={locale}
          title={t("actionsHeading")}
          testId="monthly-review-actions"
        />
      ) : null}

      {isEmpty ? (
        <Card tone="soft">
          <p className="font-semibold text-text-primary">{t("emptyTitle")}</p>
          <Text size="sm" tone="secondary" className="mt-1">
            {t("emptyBody")}
          </Text>
        </Card>
      ) : null}

      <BottomActionBar>
        <MonthlyReviewActions
          periodMonth={review.periodMonth}
          reviewState={review.review.state}
          snapshot={{
            cashFlow: review.cashFlow,
            jars: review.jars,
            goals: review.goals,
          }}
        />
        <Link href={APP_PATH.PLAN} className={PLAN_SURFACE_LINK_CLASS}>
          {t("backToPlan")}
        </Link>
      </BottomActionBar>
    </div>
  );
}
