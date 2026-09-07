import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planGoalPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listGoals } from "@/modules/plan/application/queries/list-goals";
import { listGoalFundingOptions } from "@/modules/plan/application/queries/list-goal-funding-options";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { GoalCard } from "@/shared/patterns/goal-card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { CreateGoalForm } from "./create-goal-form";

type Props = { params: Promise<{ locale: string }> };

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
        />
      }
    >
      <PlanOfflineBanner />

      {goals.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={<AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.DISPLAY} />}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link href={planGoalPath(goal.id)} className="block">
                <GoalCard
                  name={goal.name}
                  fundedLabel={t.rich("fundedLabel", {
                    amount: formatCurrency(
                      goal.fundedAmount,
                      currency,
                      locale,
                      {
                        maximumFractionDigits: 0,
                      },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                  targetLabel={t.rich("targetLabel", {
                    amount: formatCurrency(
                      goal.targetAmount,
                      currency,
                      locale,
                      {
                        maximumFractionDigits: 0,
                      },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })}
                  progressPercent={goal.progressPercent}
                  progressUnavailableLabel={t("progressIndeterminate")}
                  statusLabel={`${t(`status.${goal.status}`)} · ${t(`backing.${goal.backingState}`)}`}
                  data-testid={`goal-card-${goal.id}`}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateGoalForm fundingOptions={fundingOptions} />
    </Page>
  );
}
