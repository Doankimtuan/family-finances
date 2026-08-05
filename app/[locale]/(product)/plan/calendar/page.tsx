import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHouseholdCalendar } from "@/modules/plan/application";
import { currentPeriodMonth } from "@/modules/plan/application/ritual-period";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { HouseholdCalendarView } from "./calendar-view";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
};

/**
 * plan.calendar — Household Financial Calendar (ST-E05 / REQ-CAL-01).
 */
export default async function PlanCalendarPage({
  params,
  searchParams,
}: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const { month: rawMonth } = await searchParams;
  const anchorMonth =
    rawMonth && /^\d{4}-\d{2}(-\d{2})?$/.test(rawMonth)
      ? `${rawMonth.slice(0, 7)}-01`
      : currentPeriodMonth();

  const [t, calendar] = await Promise.all([
    getTranslations("plan.calendar"),
    getHouseholdCalendar(anchorMonth),
  ]);

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-calendar-page">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {calendar ? (
          <HouseholdCalendarView
            anchorMonth={calendar.anchorMonth}
            currency={calendar.currency}
            events={calendar.events}
            eventsByDate={calendar.eventsByDate}
            deficitDates={calendar.deficitDates}
            payoffMilestoneDates={calendar.payoffMilestoneDates}
            startingBalance={calendar.startingBalance}
            payoffInboxItemByPlanId={calendar.payoffInboxItemByPlanId}
          />
        ) : (
          <EmptyState
            title={t("unavailableTitle")}
            description={t("unavailableBody")}
            className="flex-none py-(--space-4)"
          />
        )}

        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="calendar-back-plan"
        >
          {t("backToPlan")}
        </Link>
      </div>
    </div>
  );
}
