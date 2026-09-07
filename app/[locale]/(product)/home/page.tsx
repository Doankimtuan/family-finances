import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { redirect, Link } from "@/i18n/navigation";
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
  calculateMoneyAssetOverview,
  MoneyAssetOverviewStatus,
} from "@/modules/ledger/application";
import {
  HOME_DASHBOARD_DEFAULT_PERIOD,
  HOME_PERIOD_FOCUS_INTENT_KEY,
  HOME_PERIOD_FOCUS_QUERY,
  HOME_PRODUCT_FAILURE_QUERY,
  HomeProductSummaryKey,
  HOME_TRANSLATION_NAMESPACE,
  HOME_TEST_ID,
  HomeDashboardPeriod,
  HomeDashboardReadStatus,
  HomeProductReadStatus,
  HomeStatusLaneKind,
  homeGreetingPeriod,
} from "@/modules/home/application/home-constants";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Section } from "@/shared/patterns/section";

import { Page } from "@/shared/patterns/page";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  NAVIGATION_ICONS,
} from "@/shared/ui/icon-registry";
import { MotionReveal } from "@/shared/motion";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeCashFlowSection } from "./home-cash-flow-section";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeFinancialPulse } from "./home-financial-pulse";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomePeriodControl } from "./home-period-control";
import { HomePeriodData, HomePeriodTransition } from "./home-period-transition";
import { HomeSpendingSection } from "./home-spending-section";
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
 * Home is a mobile decision surface: current position, flow, spending,
 * attention, then plan.
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
  const [t, dashboard, savings, investments, loans, debt] = await Promise.all([
    getTranslations(HOME_TRANSLATION_NAMESPACE),
    getHomeDashboard(period),
    getHomeSavingsSummary(),
    getHomeInvestmentSummary(
      productFailure === HomeProductSummaryKey.INVESTMENTS,
    ),
    getHomeLoanSummary(),
    getHomeDebtSummary(),
  ]);
  const dashboardData =
    dashboard.status === HomeDashboardReadStatus.ERROR
      ? null
      : dashboard.dashboard;
  const hasCashFlow =
    dashboard.status !== HomeDashboardReadStatus.ERROR &&
    dashboard.dashboard.financialMetrics != null &&
    (dashboard.dashboard.financialMetrics.income > 0 ||
      dashboard.dashboard.financialMetrics.expense > 0);
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

  return (
    <Page
      testId={HOME_TEST_ID.DASHBOARD}
      topBar={
        <TopAppBar
          variant="contextual"
          showBrandMark
          eyebrow={t("header.eyebrow")}
          title={t(`header.greeting.${homeGreetingPeriod()}`)}
          subtitle={t("header.dashboardSupporting")}
          icon={NAVIGATION_ICONS.home}
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
            <HomePeriodData period={dashboard.dashboard.period}>
              <MotionReveal>
                <HomeFinancialPulse
                  balance={
                    assetOverview.status ===
                    MoneyAssetOverviewStatus.UNAVAILABLE
                      ? null
                      : assetOverview.total
                  }
                  balanceNote={
                    assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
                      ? t(
                          "financialPulse.partial",
                          assetOverview.investmentCoverage,
                        )
                      : undefined
                  }
                  currency={dashboard.dashboard.currency}
                  locale={locale}
                  period={dashboard.dashboard.period}
                  metrics={dashboard.dashboard.financialMetrics}
                  periodControl={
                    <HomePeriodControl
                      restoreFocus={
                        focusIntent === HOME_PERIOD_FOCUS_INTENT_KEY
                      }
                    />
                  }
                />
              </MotionReveal>
              {hasCashFlow && dashboard.dashboard.financialMetrics ? (
                <Card
                  tone="elevated"
                  className="gap-0 p-(--space-4)"
                  data-testid={HOME_TEST_ID.PERIOD_STORY}
                >
                  <HomeCashFlowSection
                    metrics={dashboard.dashboard.financialMetrics}
                    currency={dashboard.dashboard.currency}
                    locale={locale}
                  />
                  <div className="my-(--space-4) border-t border-divider" />
                  <HomeSpendingSection
                    metrics={dashboard.dashboard.financialMetrics}
                    currency={dashboard.dashboard.currency}
                    locale={locale}
                    canReviewUncategorized={
                      dashboard.dashboard.canReviewUncategorized
                    }
                  />
                </Card>
              ) : null}
            </HomePeriodData>
            <HomeProductSummaries
              locale={locale}
              currency={dashboard.dashboard.currency}
              savings={savings}
              investments={investments}
              loans={loans}
              debt={debt}
              t={t}
            />
            <Section
              title={t("inbox.title")}
              contentClassName="gap-(--space-3)"
              testId={HOME_TEST_ID.INBOX_BLOCK}
            >
              <HomeInboxCta openCount={dashboard.dashboard.openInboxCount} />
            </Section>
            <Section
              title={t("planPulse.title")}
              description={t("planPulse.hint")}
              testId={HOME_TEST_ID.PLAN_PULSE}
            >
              <Card tone="elevated" className="gap-0 p-0">
                <Link
                  href={APP_PATH.PLAN}
                  aria-label={t("planPulse.openPlan")}
                  className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid={HOME_TEST_ID.PLAN_LINK}
                >
                  <IconContainer tone={IconContainerTone.SAVINGS} size="md">
                    <AppIcon icon={FINANCE_ICONS.savings} size="md" />
                  </IconContainer>
                  <div className="min-w-0 flex-1">
                    <Text size="lg" className="font-semibold text-text-primary">
                      {t("planPulse.jarsCount", {
                        count: dashboard.dashboard.activeJarCount,
                      })}
                    </Text>
                    <Text size="sm" tone="secondary" className="text-pretty">
                      {t(
                        `planPulse.allocate.${dashboard.dashboard.incomeAllocateMode}`,
                      )}
                    </Text>
                  </div>
                  <AppIcon
                    icon={ACTION_ICONS.forward}
                    size="sm"
                    className="shrink-0 text-text-tertiary"
                  />
                </Link>
              </Card>
            </Section>
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
