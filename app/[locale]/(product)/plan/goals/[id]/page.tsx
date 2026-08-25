import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getGoal,
  listGoals,
} from "@/modules/plan/application/queries/list-goals";
import { listGoalFundingOptions } from "@/modules/plan/application/queries/list-goal-funding-options";
import {
  GoalStatus,
  GoalType,
} from "@/modules/plan/application/plan-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge } from "@/shared/ui/status-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { GoalDetailControls } from "./goal-detail-controls";
type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * plan.goal-detail — progress, target, contribute (ST-E05-003 / F3).
 */
export default async function PlanGoalDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, goal] = await Promise.all([
    getTranslations("plan.goals"),
    getGoal(id),
  ]);

  if (!goal) {
    return (
      <Page
        testId="plan-goal-detail"
        topBar={<TopAppBar title={t("notFound")} />}
      >
        <Link
          href={APP_PATH.PLAN_GOALS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("backToList")}
        </Link>
      </Page>
    );
  }

  const [fundingOptionsResult, listedGoals] = await Promise.all([
    listGoalFundingOptions({
      goalType: goal.goalType,
      goalId: goal.id,
    }),
    listGoals(),
  ]);
  const fundingOptions = fundingOptionsResult ?? [];
  const reassignmentOptions = (listedGoals?.goals ?? [])
    .filter(
      (candidate) =>
        candidate.id !== goal.id &&
        candidate.goalType === goal.goalType &&
        ["active", "ready"].includes(candidate.status),
    )
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      goalType: candidate.goalType,
    }));
  return (
    <Page
      testId="plan-goal-detail"
      topBar={
        <TopAppBar
          title={goal.name}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.PLAN_GOALS}
          backLabel={t("backToList")}
        />
      }
    >
      <PlanOfflineBanner />

      <StatusAlert
        variant="info"
        title={t("notBalanceTitle")}
        description={t("notBalanceBody")}
      />

      <Section title={t("progressHeading")}>
        <Card tone="hero" className="gap-(--space-4) p-(--space-5)">
          <div className="flex items-start justify-between gap-(--space-3)">
            <Text size="sm" className="text-hero-muted">
              {t("progressIntentionHint")}
            </Text>
            <StatusBadge
              tone="selected"
              className="bg-white/10 text-hero-fg ring-white/15"
            >
              {goal.progressPercent == null
                ? t("fundingValueQuality.indeterminate")
                : `${goal.progressPercent}%`}
            </StatusBadge>
          </div>
          {goal.progressPercent == null ? (
            <StatusAlert
              variant="info"
              title={t("fundingValueQuality.indeterminate")}
              description={t("progressIndeterminate")}
            />
          ) : (
            <Progress
              value={goal.progressPercent}
              max={100}
              label={`${goal.progressPercent}%`}
              privacyAware
            />
          )}
          {goal.progressPercent == null && goal.fundedAmount <= 0 ? null : (
            <Amount
              label={t("progressHeading")}
              amountLabel={formatCurrency(
                goal.fundedAmount,
                goal.currency,
                locale,
                { maximumFractionDigits: 0 },
              )}
              size="lg"
              labelClassName="text-hero-muted"
              amountClassName="text-hero-fg"
            />
          )}
        </Card>
        {goal.fundingSummary ? (
          <Card tone="elevated" className="gap-(--space-2) p-(--space-4)">
            {goal.goalType === GoalType.PAYOFF ? (
              <>
                <Text size="sm" tone="secondary">
                  {t.rich("originalPrincipalLabel", {
                    amount: formatCurrency(
                      goal.fundingSummary.originalPrincipalTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                </Text>
                <Text size="sm" tone="secondary">
                  {t.rich("remainingPrincipalLabel", {
                    amount: formatCurrency(
                      goal.fundingSummary.remainingPrincipalTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                </Text>
                <Text size="sm" tone="secondary">
                  {t.rich("principalPaidLabel", {
                    amount: formatCurrency(
                      goal.fundingSummary.principalPaidTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                </Text>
              </>
            ) : (
              <>
                <Text size="sm" tone="secondary">
                  {t.rich("marketValueLabel", {
                    amount: formatCurrency(
                      goal.fundingSummary.marketValue,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                </Text>
                {goal.fundingSummary.costBasis > 0 ? (
                  <Text size="sm" tone="secondary">
                    {t.rich("costBasisLabel", {
                      amount: formatCurrency(
                        goal.fundingSummary.costBasis,
                        goal.currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                      money: (chunks: ReactNode) => (
                        <FinancialValue>{chunks}</FinancialValue>
                      ),
                    })}
                  </Text>
                ) : null}
                {goal.fundingSummary.unrealizedGainLoss != null ? (
                  <Text size="sm" tone="secondary">
                    {t.rich("gainLossLabel", {
                      amount: formatCurrency(
                        goal.fundingSummary.unrealizedGainLoss,
                        goal.currency,
                        locale,
                        { maximumFractionDigits: 0, signDisplay: "always" },
                      ),
                      money: (chunks: ReactNode) => (
                        <FinancialValue>{chunks}</FinancialValue>
                      ),
                    })}
                  </Text>
                ) : null}
              </>
            )}
            <Text size="xs" tone="secondary">
              {t(`fundingValueQuality.${goal.fundingValueStatus}`)}
            </Text>
          </Card>
        ) : null}
      </Section>

      <Section variant="surface" title={t("targetHeading")}>
        <Text size="sm" tone="secondary" className="tabular-nums">
          {t.rich("targetLabel", {
            amount: formatCurrency(goal.targetAmount, goal.currency, locale, {
              maximumFractionDigits: 0,
            }),
            money: (chunks: ReactNode) => (
              <FinancialValue>{chunks}</FinancialValue>
            ),
          })}
        </Text>
        <StatusBadge
          tone={
            goal.status === GoalStatus.COMPLETED
              ? "positive"
              : goal.status === GoalStatus.CANCELLED
                ? "neutral"
                : "info"
          }
        >
          {t(`status.${goal.status}`)}
        </StatusBadge>
      </Section>

      <GoalDetailControls
        goalId={goal.id}
        name={goal.name}
        targetAmount={goal.targetAmount}
        fundedAmount={goal.fundedAmount}
        progressPercent={goal.progressPercent}
        remainingPrincipal={
          goal.fundingSummary?.remainingPrincipalTotal ?? null
        }
        targetDate={goal.targetDate}
        status={goal.status}
        goalType={goal.goalType}
        fundingLinks={goal.fundingLinks}
        fundingOptions={fundingOptions.filter(
          (option) => option.linkedGoalId !== goal.id,
        )}
        reassignmentOptions={reassignmentOptions}
        isLegacyIntention={goal.isLegacyIntention}
      />
    </Page>
  );
}
