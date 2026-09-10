import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import {
  getGoal,
  listGoals,
} from "@/modules/plan/application/queries/list-goals";
import { listGoalFundingOptions } from "@/modules/plan/application/queries/list-goal-funding-options";
import {
  GoalStatus,
  GoalType,
  GOAL_FUNDING_LINKABLE_STATUS_VALUES,
} from "@/modules/plan/application/plan-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Progress } from "@/shared/ui/progress";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { PlanPrivacyToggle } from "../../plan-privacy-toggle";
import { PlanSectionTitle } from "../../plan-section-title";
import { PlanUnavailable } from "../../plan-unavailable";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { GoalDetailControls } from "./goal-detail-controls";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

type GoalTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<
      string,
      string | number | ((chunks: ReactNode) => ReactNode)
    >,
  ) => ReactNode;
};

function goalStatusTone(status: (typeof GoalStatus)[keyof typeof GoalStatus]) {
  if (status === GoalStatus.COMPLETED) return StatusBadgeTone.POSITIVE;
  if (status === GoalStatus.CANCELLED) return StatusBadgeTone.NEUTRAL;
  return StatusBadgeTone.INFO;
}

function moneyLeaf(
  t: GoalTranslator,
  key: string,
  amount: string,
  kind: FinancialNumberKind,
) {
  return t.rich(key, {
    amount,
    money: (chunks: ReactNode) => (
      <FinancialValue>
        <span data-financial-kind={kind}>{chunks}</span>
      </FinancialValue>
    ),
  });
}

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
        topBar={
          <TopAppBar
            variant={TopAppBarVariant.DETAIL}
            title={t("notFound")}
            backHref={APP_PATH.PLAN_GOALS}
            backLabel={t("backToList")}
          />
        }
      >
        <PlanUnavailable
          title={t("notFound")}
          description={t("detailSubtitle")}
          actionHref={APP_PATH.PLAN_GOALS}
          actionLabel={t("backToList")}
          icon={<AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.DISPLAY} />}
        />
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
  const linkableStatuses = new Set<string>(GOAL_FUNDING_LINKABLE_STATUS_VALUES);
  const reassignmentOptions = (listedGoals?.goals ?? [])
    .filter(
      (candidate) =>
        candidate.id !== goal.id &&
        candidate.goalType === goal.goalType &&
        linkableStatuses.has(candidate.status),
    )
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      goalType: candidate.goalType,
    }));
  const translator = t as unknown as GoalTranslator;
  const targetDate = goal.targetDate
    ? formatDate(new Date(`${goal.targetDate}T00:00:00Z`), locale, {
        month: "short",
        year: "numeric",
        timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
      })
    : null;
  const showFundedAmount = !(
    goal.progressPercent == null && goal.fundedAmount <= 0
  );

  return (
    <Page
      testId="plan-goal-detail"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={goal.name}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.PLAN_GOALS}
          backLabel={t("backToList")}
        />
      }
    >
      <PlanOfflineBanner />

      <StatusAlert
        variant={AlertVariant.INFO}
        title={t("notBalanceTitle")}
        description={t("notBalanceBody")}
      />

      <Card
        tone="hero"
        className="gap-0 p-(--space-4)"
        data-testid="plan-goal-hero"
      >
        <div className="flex items-center gap-(--space-3)">
          <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
              <AppIcon
                icon={PLAN_ICONS.goal}
                size={AppIconSize.MD}
                emphasized
              />
            </span>
            <Text
              size="sm"
              weight="medium"
              className="text-pretty text-hero-muted"
            >
              {t("progressIntentionHint")}
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-(--space-2)">
            <StatusBadge
              tone={StatusBadgeTone.SELECTED}
              className="bg-white/10 text-hero-fg ring-white/15"
            >
              {goal.progressPercent == null
                ? t("fundingValueQuality.indeterminate")
                : t("progressPercentLabel", { percent: goal.progressPercent })}
            </StatusBadge>
            <PlanPrivacyToggle testId="plan-goal-privacy-toggle" />
          </div>
        </div>
        <div className="mt-(--space-4) flex flex-col gap-(--space-3)">
          {goal.progressPercent == null ? (
            <StatusAlert
              variant={AlertVariant.INFO}
              title={t("fundingValueQuality.indeterminate")}
              description={t("progressIndeterminate")}
            />
          ) : (
            <Progress
              value={goal.progressPercent}
              max={100}
              label={t("progressPercentLabel", {
                percent: goal.progressPercent,
              })}
              privacyAware
            />
          )}
          {showFundedAmount ? (
            <Amount
              label={t("progressHeading")}
              amountLabel={formatCurrency(
                goal.fundedAmount,
                goal.currency,
                locale,
                { maximumFractionDigits: 0 },
              )}
              size={AmountSize.LG}
              kind={FinancialNumberKind.INTENTION}
              labelClassName="text-hero-muted"
              amountClassName="text-hero-fg"
            />
          ) : null}
        </div>
      </Card>

      <Section
        variant="surface"
        title={<PlanSectionTitle>{t("targetHeading")}</PlanSectionTitle>}
      >
        <Text
          size="sm"
          tone="secondary"
          className="tabular-nums"
          data-financial-kind={FinancialNumberKind.INTENTION}
        >
          {moneyLeaf(
            translator,
            "targetLabel",
            formatCurrency(goal.targetAmount, goal.currency, locale, {
              maximumFractionDigits: 0,
            }),
            FinancialNumberKind.INTENTION,
          )}
        </Text>
        <div className="flex flex-wrap items-center gap-(--space-2)">
          <StatusBadge tone={goalStatusTone(goal.status)}>
            {t(`status.${goal.status}`)}
          </StatusBadge>
          <Text size="xs" tone="muted">
            {t(`type.${goal.goalType}`)}
            {targetDate ? ` · ${targetDate}` : ""}
          </Text>
        </div>
      </Section>

      {goal.fundingSummary ? (
        <Section
          variant="surface"
          title={
            <PlanSectionTitle>{t("linkedSourceHeading")}</PlanSectionTitle>
          }
        >
          <Text size="sm" tone="secondary" className="text-pretty">
            {t("linkedSourceHint")}
          </Text>
          <Card tone="elevated" className="gap-(--space-2) p-(--space-4)">
            {goal.goalType === GoalType.PAYOFF ? (
              <>
                <Text size="sm" tone="secondary">
                  {moneyLeaf(
                    translator,
                    "originalPrincipalLabel",
                    formatCurrency(
                      goal.fundingSummary.originalPrincipalTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    FinancialNumberKind.CURRENT_STATE,
                  )}
                </Text>
                <Text size="sm" tone="secondary">
                  {moneyLeaf(
                    translator,
                    "remainingPrincipalLabel",
                    formatCurrency(
                      goal.fundingSummary.remainingPrincipalTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    FinancialNumberKind.CURRENT_STATE,
                  )}
                </Text>
                <Text size="sm" tone="secondary">
                  {moneyLeaf(
                    translator,
                    "principalPaidLabel",
                    formatCurrency(
                      goal.fundingSummary.principalPaidTotal,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    FinancialNumberKind.CURRENT_STATE,
                  )}
                </Text>
              </>
            ) : (
              <>
                <Text size="sm" tone="secondary">
                  {moneyLeaf(
                    translator,
                    "marketValueLabel",
                    formatCurrency(
                      goal.fundingSummary.marketValue,
                      goal.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    FinancialNumberKind.ESTIMATE,
                  )}
                </Text>
                {goal.fundingSummary.costBasis > 0 ? (
                  <Text size="sm" tone="secondary">
                    {moneyLeaf(
                      translator,
                      "costBasisLabel",
                      formatCurrency(
                        goal.fundingSummary.costBasis,
                        goal.currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                      FinancialNumberKind.CURRENT_STATE,
                    )}
                  </Text>
                ) : null}
                {goal.fundingSummary.unrealizedGainLoss != null ? (
                  <Text size="sm" tone="secondary">
                    {moneyLeaf(
                      translator,
                      "gainLossLabel",
                      formatCurrency(
                        goal.fundingSummary.unrealizedGainLoss,
                        goal.currency,
                        locale,
                        { maximumFractionDigits: 0, signDisplay: "always" },
                      ),
                      FinancialNumberKind.ESTIMATE,
                    )}
                  </Text>
                ) : null}
              </>
            )}
            <Text size="xs" tone="secondary">
              {t(`fundingValueQuality.${goal.fundingValueStatus}`)}
            </Text>
          </Card>
        </Section>
      ) : null}

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
