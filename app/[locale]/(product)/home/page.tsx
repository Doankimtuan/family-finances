import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import {
  getHomeDashboard,
  getHomeDebtSummary,
  getHomeInvestmentSummary,
  getHomeLoanSummary,
  getHomeSavingsSummary,
} from "@/modules/home/application";
import {
  HOME_DASHBOARD_DEFAULT_PERIOD,
  HOME_PERIOD_FOCUS_INTENT_KEY,
  HOME_PERIOD_FOCUS_QUERY,
  HOME_PRODUCT_FAILURE_QUERY,
  HomeProductReadStatus,
  HomeProductSummaryKey,
  HOME_TRANSLATION_NAMESPACE,
  HOME_TEST_ID,
  HomeDashboardPeriod,
  HomeDashboardReadStatus,
  HomeStatusLaneKind,
  homeGreetingPeriod,
} from "@/modules/home/application/home-constants";
import {
  calculateMoneyAssetOverview,
  MoneyAssetOverviewStatus,
} from "@/modules/ledger/application";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Section } from "@/shared/patterns/section";
import { Page } from "@/shared/patterns/page";
import { MotionReveal } from "@/shared/motion";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeFinancialPulse } from "./home-financial-pulse";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomePeriodControl } from "./home-period-control";
import { HomePeriodTransition } from "./home-period-transition";
import { HomePeriodStory } from "./home-period-story";
import { HomePlanPulse } from "./home-plan-pulse";
import { HomeStatusLane } from "./home-status-lane";
import { HomeProductSummaries } from "./home-product-summaries";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<
    { period?: string; focus?: string } & Record<string, string | undefined>
  >;
};

function resolveDashboardPeriod(rawPeriod?: string) {
  return rawPeriod === HomeDashboardPeriod.QUARTER
    ? HomeDashboardPeriod.QUARTER
    : HOME_DASHBOARD_DEFAULT_PERIOD;
}

/**
 * Home is the household command center: current position, attention,
 * intention, then period movement.
 */
export default async function HomePage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const {
    period: rawPeriod,
    [HOME_PERIOD_FOCUS_QUERY]: focusIntent,
    [HOME_PRODUCT_FAILURE_QUERY]: productFailure,
  } = await searchParams;
  const period = resolveDashboardPeriod(rawPeriod);
  const [t, dashboard, savings, investments, loans, debt, preferences] =
    await Promise.all([
      getTranslations(HOME_TRANSLATION_NAMESPACE),
      getHomeDashboard(period),
      getHomeSavingsSummary(),
      getHomeInvestmentSummary(
        productFailure === HomeProductSummaryKey.INVESTMENTS,
      ),
      getHomeLoanSummary(),
      getHomeDebtSummary(),
      getHouseholdPreferences(),
    ]);
  const dashboardData =
    dashboard.status === HomeDashboardReadStatus.ERROR
      ? null
      : dashboard.dashboard;
  const householdEyebrow =
    preferences?.householdName || t("header.householdContext");
  const assetOverview = calculateMoneyAssetOverview({
    accounts: dashboardData?.realBalance ?? null,
    savings:
      savings.status === HomeProductReadStatus.READY
        ? savings.summary.principal
        : null,
    investments:
      investments.status === HomeProductReadStatus.READY
        ? {
            amount: investments.summary.marketValue,
            valuationIncluded: investments.summary.valuationIncluded,
            valuationTotal: investments.summary.valuationTotal,
          }
        : null,
  });
  const pulseBalance =
    assetOverview.status === MoneyAssetOverviewStatus.UNAVAILABLE
      ? null
      : assetOverview.total;
  const pulseNote =
    assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
      ? t("financialPulse.partial", assetOverview.investmentCoverage)
      : undefined;

  return (
    <Page
      testId={HOME_TEST_ID.DASHBOARD}
      topBar={
        <TopAppBar
          variant="contextual"
          showBrandMark
          eyebrow={householdEyebrow}
          title={t(`header.greeting.${homeGreetingPeriod()}`)}
          subtitle={t("header.dashboardSupporting")}
          meta={
            dashboardData
              ? t("header.meta.available", {
                  accountCount: dashboardData.accountCount,
                  openInboxCount: dashboardData.openInboxCount,
                })
              : t("header.meta.unavailable")
          }
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <HomeStatusLane kind={HomeStatusLaneKind.OFFLINE} />
      {dashboard.status === HomeDashboardReadStatus.ERROR ? (
        <HomeStatusLane
          kind={HomeStatusLaneKind.ERROR}
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
          retryLabel={t("status.retry")}
        />
      ) : dashboard.dashboard.isDayZero ? (
        <HomeDayZeroTrio />
      ) : (
        <>
          {dashboard.status === HomeDashboardReadStatus.PARTIAL ? (
            <HomeStatusLane kind={HomeStatusLaneKind.PARTIAL} />
          ) : null}
          <HomePeriodTransition period={dashboard.dashboard.period}>
            <MotionReveal>
              <HomeFinancialPulse
                balance={pulseBalance}
                balanceNote={pulseNote}
                currency={dashboard.dashboard.currency}
                locale={locale}
              />
            </MotionReveal>
            <Section
              title={t("inbox.title")}
              contentClassName="gap-(--space-3)"
              testId={HOME_TEST_ID.INBOX_BLOCK}
            >
              <HomeInboxCta openCount={dashboard.dashboard.openInboxCount} />
            </Section>
            <HomePlanPulse
              title={t("planPulse.title")}
              hint={t("planPulse.hint")}
              jarsCount={t("planPulse.jarsCount", {
                count: dashboard.dashboard.activeJarCount,
              })}
              allocateLabel={t(
                `planPulse.allocate.${dashboard.dashboard.incomeAllocateMode}`,
              )}
              openLabel={t("planPulse.openPlan")}
            />
            {dashboard.dashboard.financialMetrics ? (
              <HomePeriodStory
                metrics={dashboard.dashboard.financialMetrics}
                currency={dashboard.dashboard.currency}
                locale={locale}
                period={dashboard.dashboard.period}
                canReviewUncategorized={
                  dashboard.dashboard.canReviewUncategorized
                }
                periodControl={
                  <HomePeriodControl
                    restoreFocus={focusIntent === HOME_PERIOD_FOCUS_INTENT_KEY}
                  />
                }
              />
            ) : null}
            <HomeProductSummaries
              locale={locale}
              currency={dashboard.dashboard.currency}
              savings={savings}
              investments={investments}
              loans={loans}
              debt={debt}
              t={t}
            />
          </HomePeriodTransition>
          <FloatingAction>
            <HomeCaptureAction
              accountCount={dashboard.dashboard.accountCount}
            />
          </FloatingAction>
        </>
      )}
    </Page>
  );
}
