import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHouseholdCalendar } from "@/modules/plan/application";
import { currentPeriodMonth } from "@/modules/plan/application/ritual-period";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { PlanPrivacyToggle } from "../plan-privacy-toggle";
import { HouseholdCalendarView } from "./calendar-view";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Partial<Record<typeof PLAN_MONTH_QUERY, string>>>;
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

  const query = await searchParams;
  const rawMonth = query[PLAN_MONTH_QUERY];
  const anchorMonth =
    rawMonth && /^\d{4}-\d{2}(-\d{2})?$/.test(rawMonth)
      ? `${rawMonth.slice(0, 7)}-01`
      : currentPeriodMonth();

  const [t, calendar] = await Promise.all([
    getTranslations("plan.calendar"),
    getHouseholdCalendar(anchorMonth),
  ]);

  return (
    <Page
      testId="plan-calendar-page"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("title")}
          subtitle={t("subtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
          trailing={<PlanPrivacyToggle testId="plan-calendar-privacy-toggle" />}
        />
      }
    >
      {calendar ? (
        <HouseholdCalendarView
          key={calendar.anchorMonth}
          anchorMonth={calendar.anchorMonth}
          currency={calendar.currency}
          eventsByDate={calendar.eventsByDate}
          deficitDates={calendar.deficitDates}
          payoffMilestoneDates={calendar.payoffMilestoneDates}
          payoffInboxItemByPlanId={calendar.payoffInboxItemByPlanId}
        />
      ) : (
        <HouseholdCalendarView
          key={anchorMonth}
          anchorMonth={anchorMonth}
          isUnavailable
        />
      )}
    </Page>
  );
}
