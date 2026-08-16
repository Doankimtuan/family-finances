"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Progress } from "@/shared/ui/progress";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { formatCurrency } from "@/shared/i18n/formatters";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import {
  markMonthlyReviewReviewed,
  markMonthlyReviewViewed,
} from "./actions-review";
import { RecommendationList } from "../recommendation-list";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";

type Props = { review: MonthlyReview };

function monthStep(periodMonth: string, delta: number) {
  const start = new Date(`${periodMonth}T00:00:00.000Z`);
  const next = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1),
  );
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "credit" | "debit";
}) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius-card)] bg-surface-muted/60 p-(--space-3)">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <p
        className={`text-lg font-semibold tabular-nums tracking-tight ${tone === "credit" ? "text-success" : tone === "debit" ? "text-danger" : "text-text-primary"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function MonthlyReviewReport({ review }: Props) {
  const t = useTranslations("plan.monthlyReview");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const money = (value: number) =>
    formatCurrency(value, review.currency, locale, {
      maximumFractionDigits: 0,
    });
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${review.periodMonth}T00:00:00.000Z`)),
    [locale, review.periodMonth],
  );
  const previousMonth = monthStep(review.periodMonth, -1);
  const nextMonth = monthStep(review.periodMonth, 1);
  const canGoNext = nextMonth <= review.currentPeriodMonth;
  const jarAttentionCount = review.jars.filter(
    (jar) => jar.state === "overspent" || jar.state === "near_limit",
  ).length;
  const isEmpty =
    review.cashFlow.activityCount === 0 &&
    review.jars.length === 0 &&
    review.goals.length === 0;

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
      return `${APP_PATH.PLAN_GOALS}/${action.entityId}`;
    if (action.entityType === "jar" && action.entityId)
      return `${APP_PATH.PLAN_JARS}/${action.entityId}`;
    if (action.entityType === "recurring" && action.entityId)
      return `${APP_PATH.PLAN_RECURRING}/${action.entityId}`;
    return APP_PATH.PLAN;
  };
  useEffect(() => {
    if (review.review.state === "not_started") {
      void markMonthlyReviewViewed(review.periodMonth);
    }
  }, [review.periodMonth, review.review.state]);

  function markReviewed() {
    startTransition(async () => {
      await markMonthlyReviewReviewed(review.periodMonth, {
        capturedAt: new Date().toISOString(),
        cashFlow: review.cashFlow,
        jars: review.jars,
        goals: review.goals,
      });
      router.refresh();
    });
  }

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="monthly-review-report"
    >
      <section className="rounded-[var(--radius-card)] border border-accent/20 bg-accent/10 p-(--space-4)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div>
            <Text
              size="xs"
              tone="secondary"
              className="uppercase tracking-[0.14em]"
            >
              {t("eyebrow")}
            </Text>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
              {monthLabel}
            </h1>
            <Text size="sm" tone="secondary" className="mt-2">
              {review.isCurrentPeriod ? t("inProgress") : t("subtitle")}
            </Text>
          </div>
          <span className="rounded-full bg-surface/80 px-(--space-2) py-1 text-xs font-semibold text-text-secondary">
            {review.review.state === "marked_reviewed"
              ? t("reviewed")
              : t("notReviewed")}
          </span>
        </div>
        <div className="mt-(--space-4) flex items-center justify-between gap-(--space-2)">
          <Link
            href={`${APP_PATH.PLAN_RITUAL}?month=${previousMonth}`}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("previousMonth")}
          </Link>
          <Text size="sm" tone="secondary">
            {review.isCurrentPeriod ? t("currentMonth") : t("historicalMonth")}
          </Text>
          {canGoNext ? (
            <Link
              href={`${APP_PATH.PLAN_RITUAL}?month=${nextMonth}`}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("nextMonth")}
            </Link>
          ) : (
            <span className="min-w-20" aria-hidden="true" />
          )}
        </div>
      </section>

      {review.review.updatedAfterReview ? (
        <StatusAlert
          variant="info"
          title={t("updatedAfterReviewTitle")}
          description={t("updatedAfterReviewBody")}
        />
      ) : null}

      <Section title={t("summaryHeading")} testId="monthly-review-cash-flow">
        <div className="grid grid-cols-2 gap-(--space-2)">
          <Metric
            label={t("income")}
            value={money(review.cashFlow.income)}
            tone="credit"
          />
          <Metric
            label={t("expenses")}
            value={money(review.cashFlow.expenses)}
            tone="debit"
          />
          <Metric
            label={t("savingsAdded")}
            value={money(review.cashFlow.savingsAdded)}
          />
          <Metric
            label={t("netInvested")}
            value={money(review.cashFlow.netInvested)}
          />
          <Metric
            label={t("debtReduced")}
            value={money(review.cashFlow.debtPrincipalReduced)}
          />
          <Metric
            label={t("netCashFlow")}
            value={`${review.cashFlow.netCashFlow >= 0 ? "+" : ""}${money(review.cashFlow.netCashFlow)}`}
            tone={review.cashFlow.netCashFlow >= 0 ? "credit" : "debit"}
          />
        </div>
        <Text size="sm" tone="secondary">
          {t("summaryNote")}
        </Text>
      </Section>

      <Section
        title={t("jarsHeading")}
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
              className="mt-2 text-sm font-semibold text-accent"
            >
              {t("setupJars")}
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-(--space-3)">
            {review.jars.map((jar) => (
              <div
                key={jar.id}
                className="rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface p-(--space-3)"
              >
                <div className="flex items-start justify-between gap-(--space-3)">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {jar.name}
                    </p>
                    <Text size="sm" tone="secondary">
                      {money(jar.spent)} / {money(jar.budget)}
                    </Text>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${jar.state === "overspent" ? "text-danger" : "text-text-secondary"}`}
                  >
                    {jar.usagePercent}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.max(0, jar.usagePercent))}
                  showLabel={false}
                  className="mt-3"
                  indicatorClassName={
                    jar.state === "overspent" ? "bg-danger" : undefined
                  }
                />
                <Text
                  size="sm"
                  tone={jar.state === "overspent" ? "danger" : "secondary"}
                  className="mt-2"
                >
                  {jar.remaining >= 0
                    ? t("jarRemaining", { amount: money(jar.remaining) })
                    : t("jarOver", { amount: money(Math.abs(jar.remaining)) })}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Section>

      {review.goals.length > 0 ? (
        <Section title={t("goalsHeading")} testId="monthly-review-goals">
          <div className="flex flex-col gap-(--space-3)">
            {review.goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface p-(--space-3)"
              >
                <div className="flex items-start justify-between gap-(--space-3)">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {goal.name}
                    </p>
                    <Text size="sm" tone="secondary">
                      {goal.backing === "legacy"
                        ? t("legacyProgress")
                        : goal.backing === "missing"
                          ? t("missingBacking")
                          : t("linkedFunding")}
                    </Text>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-text-secondary">
                    {goal.progressPercent}%
                  </span>
                </div>
                <Progress
                  value={goal.progressPercent}
                  showLabel={false}
                  className="mt-3"
                />
                <Text size="sm" tone="secondary" className="mt-2">
                  {money(goal.fundedAmount)} / {money(goal.targetAmount)}
                </Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {review.changes.length > 0 ? (
        <Section title={t("changesHeading")} testId="monthly-review-changes">
          <div className="flex flex-col gap-2">
            {review.changes.map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-surface-muted/60 px-(--space-3) py-(--space-3)"
              >
                <span className="text-sm text-text-primary">
                  {t(`changeLabels.${change.label}`)}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${change.direction === "up" ? "text-danger" : "text-success"}`}
                >
                  {change.amount >= 0 ? "+" : ""}
                  {money(change.amount)}
                  {change.percent == null
                    ? ""
                    : ` (${change.percent >= 0 ? "+" : ""}${change.percent}%)`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {review.issues.length > 0 ? (
        <Section title={t("issuesHeading")} testId="monthly-review-issues">
          <div className="flex flex-col gap-2">
            {review.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-warning/20 bg-warning/10 px-(--space-3) py-(--space-3)"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {issue.kind === "uncategorized"
                      ? t("uncategorized", { count: issue.value ?? 0 })
                      : issue.kind === "overspent_jar"
                        ? t("overspentJar", {
                            name: issue.name ?? "",
                            amount: money(issue.value ?? 0),
                          })
                        : issue.kind === "goal_backing"
                          ? t("goalBacking", { name: issue.name ?? "" })
                          : t("missingIncome")}
                  </p>
                  <Text size="sm" tone="secondary">
                    {t("reviewWithoutBlocking")}
                  </Text>
                </div>
                <Link
                  href={
                    issue.kind === "uncategorized"
                      ? APP_PATH.MONEY_TRANSACTIONS
                      : issue.kind === "goal_backing"
                        ? APP_PATH.PLAN_GOALS
                        : APP_PATH.PLAN_JARS
                  }
                  className="shrink-0 text-sm font-semibold text-accent"
                >
                  {t("open")}
                </Link>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {review.assistMode === "assisted" ? (
        <RecommendationList
          recommendations={review.recommendations}
          t={
            t as unknown as (
              key: string,
              values?: Record<string, string | number>,
            ) => string
          }
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

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-(--space-4)">
        {review.review.state === "marked_reviewed" ? (
          <StatusAlert
            variant="success"
            title={t("reviewed")}
            description={t("reviewedBody")}
          />
        ) : (
          <Button
            onPress={markReviewed}
            isDisabled={isPending}
            className="w-full"
          >
            {isPending ? t("saving") : t("markReviewed")}
          </Button>
        )}
        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToPlan")}
        </Link>
      </div>
    </div>
  );
}
