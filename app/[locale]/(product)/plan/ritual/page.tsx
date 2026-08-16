import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getMonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { EmptyState } from "@/shared/patterns/empty-state";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { MonthlyReviewReport } from "./monthly-review";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
};

function validPeriod(value: string | undefined) {
  return value && /^\d{4}-\d{2}-01$/.test(value) ? value : undefined;
}

export default async function PlanRitualPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const { month } = await searchParams;
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
    getMonthlyReview(validPeriod(month)),
  ]);
  return (
    <Page
      testId="plan-ritual-page"
      topBar={
        <TopAppBar
          variant="contextual"
          title={t("eyebrow")}
          subtitle={t("subtitle")}
          backHref={APP_PATH.PLAN}
        />
      }
    >
      <PlanOfflineBanner />
      {review ? (
        <MonthlyReviewReport review={review} />
      ) : (
        <>
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyBody")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.PLAN}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("backToPlan")}
          </Link>
        </>
      )}
    </Page>
  );
}
