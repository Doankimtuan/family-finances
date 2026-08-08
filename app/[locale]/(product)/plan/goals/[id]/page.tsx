import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getGoal } from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { Progress } from "@/shared/ui/progress";
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

  return (
    <Page
      testId="plan-goal-detail"
      topBar={
        <TopAppBar title={goal.name} subtitle={t("detailSubtitle")} />
      }
    >
      <PlanOfflineBanner />

      <StatusAlert
        variant="info"
        title={t("notBalanceTitle")}
        description={t("notBalanceBody")}
      />

      <Section title={t("progressHeading")}>
        <Progress
          value={goal.progressPercent}
          max={100}
          label={`${goal.progressPercent}%`}
        />
        <Amount
          label={t("fundedLabel", {
            amount: formatCurrency(goal.fundedAmount, goal.currency, locale, {
              maximumFractionDigits: 0,
            }),
          })}
          amountLabel={formatCurrency(
            goal.fundedAmount,
            goal.currency,
            locale,
            { maximumFractionDigits: 0 },
          )}
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {t("progressIntentionHint")}
        </Text>
      </Section>

      <Section title={t("targetHeading")}>
        <Text size="sm" tone="secondary" className="tabular-nums">
          {t("targetLabel", {
            amount: formatCurrency(goal.targetAmount, goal.currency, locale, {
              maximumFractionDigits: 0,
            }),
          })}
        </Text>
        <span className="w-fit rounded-md border border-border-subtle px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary">
          {t(`status.${goal.status}`)}
        </span>
      </Section>

      <GoalDetailControls
        goalId={goal.id}
        name={goal.name}
        targetAmount={goal.targetAmount}
        targetDate={goal.targetDate}
        status={goal.status}
      />

      <Link
        href={APP_PATH.PLAN_GOALS}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        data-testid="goal-back-list"
      >
        {t("backToList")}
      </Link>
    </Page>
  );
}
