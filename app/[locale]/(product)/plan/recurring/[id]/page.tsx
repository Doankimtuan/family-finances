import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getRecurring, RecurringDirection } from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { RecurringDetailForm } from "./recurring-detail-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * plan.recurring-detail — edit schedule (ST-E05-003).
 */
export default async function PlanRecurringDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, rule] = await Promise.all([
    getTranslations("plan.recurring"),
    getRecurring(id),
  ]);

  if (!rule) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="plan-recurring-detail"
      >
        <TopAppBar title={t("notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.PLAN_RECURRING}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="plan-recurring-detail"
    >
      <TopAppBar title={rule.name} subtitle={t("detailSubtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <PlanOfflineBanner />

        <Amount
          label={t(`direction.${rule.direction}`)}
          amountLabel={formatCurrency(rule.amount, rule.currency, locale, {
            maximumFractionDigits: 0,
          })}
          tone={
            rule.direction === RecurringDirection.INCOME ? "credit" : "debit"
          }
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {t("incomeModeLabel", {
            mode: t(`incomeModes.${rule.incomeAllocateMode}`),
          })}
        </Text>

        <RecurringDetailForm
          ruleId={rule.id}
          name={rule.name}
          direction={rule.direction}
          amount={rule.amount}
          frequency={rule.frequency}
          dayOfMonth={rule.dayOfMonth}
          dayOfWeek={rule.dayOfWeek}
          startDate={rule.startDate}
          nextRunDate={rule.nextRunDate}
          isActive={rule.isActive}
        />

        <Link
          href={APP_PATH.PLAN_RECURRING}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          data-testid="recurring-back-list"
        >
          {t("backToList")}
        </Link>
      </div>
    </div>
  );
}
