import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planGoalPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listGoals, DEFAULT_CURRENCY } from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { GoalCard } from "@/shared/patterns/goal-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { CreateGoalForm } from "./create-goal-form";

type Props = { params: Promise<{ locale: string }> };

/**
 * plan.goals — savings goal list (ST-E05-003).
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

  const [t, listed] = await Promise.all([
    getTranslations("plan.goals"),
    listGoals(),
  ]);

  const currency = listed?.currency ?? DEFAULT_CURRENCY;
  const goals = listed?.goals ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-goals">
      <TopAppBar title={t("listTitle")} subtitle={t("listSubtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <PlanOfflineBanner />

        {goals.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {goals.map((goal) => (
              <li key={goal.id}>
                <Link href={planGoalPath(goal.id)} className="block">
                  <GoalCard
                    name={goal.name}
                    fundedLabel={t("fundedLabel", {
                      amount: formatCurrency(
                        goal.fundedAmount,
                        currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                    })}
                    targetLabel={t("targetLabel", {
                      amount: formatCurrency(
                        goal.targetAmount,
                        currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                    })}
                    progressPercent={goal.progressPercent}
                    statusLabel={t(`status.${goal.status}`)}
                    data-testid={`goal-card-${goal.id}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <CreateGoalForm />

        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToPlan")}
        </Link>
      </div>
    </div>
  );
}
