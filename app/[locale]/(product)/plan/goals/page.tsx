import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planGoalPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listGoals } from "@/modules/plan/application/queries/list-goals";
import { listGoalFundingOptions } from "@/modules/plan/application/queries/list-goal-funding-options";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import type { PlanGoal } from "@/modules/plan/application";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { GoalCard } from "@/shared/patterns/goal-card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { PlanSectionTitle } from "../plan-section-title";
import { PlanDisclosure } from "../plan-disclosure";
import { PlanPrivacyToggle } from "../plan-privacy-toggle";
import { CreateGoalForm } from "./create-goal-form";
import {
  GOAL_TYPE_ICON_TONE,
  isOpenGoal,
  primaryFundingSourceName,
} from "./goal-presentations";

type Props = { params: Promise<{ locale: string }> };

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

function formatGoalDate(date: string | null, locale: string): string | null {
  if (!date) return null;
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    month: "short",
    year: "numeric",
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
  });
}

function goalSourceLabel(
  goal: PlanGoal,
  t: GoalTranslator,
  targetDate: string | null,
): string {
  const sourceName = primaryFundingSourceName(goal.fundingLinks);
  if (sourceName) return t("linkedTo", { source: sourceName });
  const backing = t(`backing.${goal.backingState}`);
  return targetDate ? `${backing} · ${targetDate}` : backing;
}

function GoalCollection({
  goals,
  t,
  currency,
  locale,
}: {
  goals: PlanGoal[];
  t: GoalTranslator;
  currency: string;
  locale: string;
}) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <ul className="divide-y divide-border-subtle/65 py-(--space-1)">
        {goals.map((goal) => {
          const targetDate = formatGoalDate(goal.targetDate, locale);
          return (
            <li key={goal.id}>
              <GoalCard
                href={planGoalPath(goal.id)}
                name={goal.name}
                fundedLabel={t.rich("fundedLabel", {
                  amount: formatCurrency(goal.fundedAmount, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                  money: (chunks: ReactNode) => (
                    <FinancialValue>
                      <span data-financial-kind={FinancialNumberKind.INTENTION}>
                        {chunks}
                      </span>
                    </FinancialValue>
                  ),
                })}
                targetLabel={t.rich("targetLabel", {
                  amount: formatCurrency(goal.targetAmount, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                  money: (chunks: ReactNode) => (
                    <FinancialValue>
                      <span data-financial-kind={FinancialNumberKind.INTENTION}>
                        {chunks}
                      </span>
                    </FinancialValue>
                  ),
                })}
                progressPercent={goal.progressPercent}
                progressLabel={
                  goal.progressPercent == null
                    ? undefined
                    : t("progressPercentLabel", {
                        percent: goal.progressPercent,
                      })
                }
                progressUnavailableLabel={t("progressIndeterminate")}
                statusLabel={t(`status.${goal.status}`)}
                sourceLabel={goalSourceLabel(goal, t, targetDate)}
                iconTone={GOAL_TYPE_ICON_TONE[goal.goalType]}
                data-testid={`goal-card-${goal.id}`}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * plan.goals — savings goal list (ST-E05-003 / F3).
 */
export default async function PlanGoalsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, listed, options] = await Promise.all([
    getTranslations("plan.goals"),
    listGoals(),
    listGoalFundingOptions(),
  ]);

  const currency = listed?.currency ?? DEFAULT_CURRENCY;
  const fundingOptions = options ?? [];
  const goals = listed?.goals ?? [];
  const openGoals = goals.filter((goal) => isOpenGoal(goal.status));
  const historyGoals = goals.filter((goal) => !isOpenGoal(goal.status));
  const translator = t as unknown as GoalTranslator;

  return (
    <Page
      testId="plan-goals"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("listTitle")}
          subtitle={t("listSubtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
          trailing={<PlanPrivacyToggle testId="plan-goals-privacy-toggle" />}
        />
      }
    >
      <PlanOfflineBanner />

      <Text size="sm" tone="secondary" className="text-pretty">
        {t("listContext")}
      </Text>

      {goals.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={<AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.DISPLAY} />}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <>
          <Section
            title={<PlanSectionTitle>{t("activeSection")}</PlanSectionTitle>}
            testId="plan-goals-active"
          >
            {openGoals.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("activeEmpty")}
              </Text>
            ) : (
              <GoalCollection
                goals={openGoals}
                t={translator}
                currency={currency}
                locale={locale}
              />
            )}
          </Section>
          <Section
            title={<PlanSectionTitle>{t("historySection")}</PlanSectionTitle>}
            testId="plan-goals-history"
          >
            {historyGoals.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("historyEmpty")}
              </Text>
            ) : (
              <PlanDisclosure
                showLabel={t("historyShow", { count: historyGoals.length })}
                hideLabel={t("historyHide")}
                testId="plan-goals-history-toggle"
              >
                <GoalCollection
                  goals={historyGoals}
                  t={translator}
                  currency={currency}
                  locale={locale}
                />
              </PlanDisclosure>
            )}
          </Section>
        </>
      )}

      <CreateGoalForm fundingOptions={fundingOptions} />
    </Page>
  );
}
