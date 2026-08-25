import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Progress } from "@/shared/ui/progress";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { RecommendationList, type Translator } from "../recommendation-list";
import type { PlanRecommendation } from "@/modules/plan/application/plan-recommendations";
import { MonthlyReviewActions } from "./monthly-review-actions";

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
  value: ReactNode;
  tone?: "neutral" | "credit" | "debit";
}) {
  return (
    <Card
      tone="metric"
      className="min-h-24 justify-between gap-(--space-2) p-(--space-3)"
    >
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <p
        className={`text-lg font-semibold tabular-nums tracking-tight ${tone === "credit" ? "text-success" : tone === "debit" ? "text-danger" : "text-text-primary"}`}
      >
        <FinancialValue>{value}</FinancialValue>
      </p>
    </Card>
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
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${review.periodMonth}T00:00:00.000Z`));
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
  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="monthly-review-report"
    >
      <Card tone="hero" className="gap-(--space-5) p-(--space-5)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div>
            <Text
              size="xs"
              className="text-hero-muted uppercase tracking-[0.14em]"
            >
              {t("eyebrow")}
            </Text>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-hero-fg">
              {monthLabel}
            </h1>
            <Text size="sm" className="mt-2 text-hero-muted">
              {review.isCurrentPeriod ? t("inProgress") : t("subtitle")}
            </Text>
          </div>
          <span className="rounded-full bg-white/10 px-(--space-2) py-1 text-xs font-semibold text-hero-fg ring-1 ring-inset ring-white/15">
            {review.review.state === "marked_reviewed"
              ? t("reviewed")
              : t("notReviewed")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-(--space-2) border-t border-white/15 pt-(--space-4)">
          <Link
            href={`${APP_PATH.PLAN_RITUAL}?month=${previousMonth}`}
            className="inline-flex min-h-11 items-center rounded-(--radius-control) border border-white/15 bg-white/10 px-(--space-3) text-sm font-medium text-hero-fg transition-[background-color,transform] duration-(--duration-fast) hover:bg-white/15 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {t("previousMonth")}
          </Link>
          <Text size="sm" className="text-hero-muted">
            {review.isCurrentPeriod ? t("currentMonth") : t("historicalMonth")}
          </Text>
          {canGoNext ? (
            <Link
              href={`${APP_PATH.PLAN_RITUAL}?month=${nextMonth}`}
              className="inline-flex min-h-11 items-center rounded-(--radius-control) border border-white/15 bg-white/10 px-(--space-3) text-sm font-medium text-hero-fg transition-[background-color,transform] duration-(--duration-fast) hover:bg-white/15 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
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
                      <FinancialValue>{money(jar.spent)}</FinancialValue> /{" "}
                      <FinancialValue>{money(jar.budget)}</FinancialValue>
                    </Text>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${jar.state === "overspent" ? "text-danger" : "text-text-secondary"}`}
                  >
                    <FinancialValue>{jar.usagePercent}%</FinancialValue>
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
                    {goal.progressPercent == null ? (
                      t("progressIndeterminate")
                    ) : (
                      <FinancialValue>{goal.progressPercent}%</FinancialValue>
                    )}
                  </span>
                </div>
                {goal.progressPercent == null ? null : (
                  <Progress
                    value={goal.progressPercent}
                    showLabel={false}
                    privacyAware
                    className="mt-3"
                  />
                )}
                <Text size="sm" tone="secondary" className="mt-2">
                  <FinancialValue>{money(goal.fundedAmount)}</FinancialValue> /{" "}
                  <FinancialValue>{money(goal.targetAmount)}</FinancialValue>
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
                  <FinancialValue>
                    {change.amount >= 0 ? "+" : ""}
                    {money(change.amount)}
                  </FinancialValue>
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
                        ? t.rich("overspentJar", {
                            name: issue.name ?? "",
                            amount: money(issue.value ?? 0),
                            money: (chunks: ReactNode) => (
                              <FinancialValue>{chunks}</FinancialValue>
                            ),
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
        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToPlan")}
        </Link>
      </BottomActionBar>
    </div>
  );
}
