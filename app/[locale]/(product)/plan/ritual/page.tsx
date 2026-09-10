import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getMonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { PlanPrivacyToggle } from "../plan-privacy-toggle";
import { PlanUnavailable } from "../plan-unavailable";
import { MonthlyReviewReport } from "./monthly-review";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Partial<Record<typeof PLAN_MONTH_QUERY, string>>>;
};

function validPeriod(value: string | undefined) {
  return value && /^\d{4}-\d{2}-01$/.test(value) ? value : undefined;
}

export default async function PlanRitualPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });
  const [t, review] = await Promise.all([
    getTranslations("plan.monthlyReview"),
    getMonthlyReview(validPeriod(query[PLAN_MONTH_QUERY])),
  ]);
  return (
    <Page
      testId="plan-ritual-page"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("eyebrow")}
          subtitle={t("subtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
          trailing={<PlanPrivacyToggle testId="plan-ritual-privacy-toggle" />}
        />
      }
    >
      <PlanOfflineBanner />
      {review ? (
        <MonthlyReviewReport review={review} />
      ) : (
        <PlanUnavailable
          title={t("emptyTitle")}
          description={t("emptyBody")}
          actionHref={APP_PATH.PLAN}
          actionLabel={t("backToPlan")}
          icon={<AppIcon icon={PLAN_ICONS.ritual} size={AppIconSize.DISPLAY} />}
        />
      )}
    </Page>
  );
}
