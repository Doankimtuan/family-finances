import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import { getHomeDashboard } from "@/modules/home/application";
import {
  HOME_DASHBOARD_DEFAULT_PERIOD,
  HOME_TRANSLATION_NAMESPACE,
  HOME_TEST_ID,
  HomeDashboardPeriod,
  HomeStatusLaneKind,
  homeGreetingPeriod,
} from "@/modules/home/application/home-constants";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { HeaderPill, TopAppBar } from "@/shared/patterns/top-app-bar";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { Page } from "@/shared/patterns/page";
import { Text } from "@/shared/ui/text";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeCashFlowSection } from "./home-cash-flow-section";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeFinancialPulse } from "./home-financial-pulse";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomePeriodControl } from "./home-period-control";
import { HomePeriodData, HomePeriodTransition } from "./home-period-transition";
import { HomeSpendingSection } from "./home-spending-section";
import { HomeStatusLane } from "./home-status-lane";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
};

function resolveDashboardPeriod(rawPeriod?: string) {
  return rawPeriod === HomeDashboardPeriod.QUARTER
    ? HomeDashboardPeriod.QUARTER
    : HOME_DASHBOARD_DEFAULT_PERIOD;
}

/**
 * Home is a mobile decision surface: current position, flow, spending, plan,
 * then attention. It intentionally excludes unreliable investment, savings,
 * loan, and liability summaries until those domain models are safe to aggregate.
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

  const { period: rawPeriod } = await searchParams;
  const period = resolveDashboardPeriod(rawPeriod);
  const [t, dashboard] = await Promise.all([
    getTranslations(HOME_TRANSLATION_NAMESPACE),
    getHomeDashboard(period),
  ]);
  const loadFailed = dashboard == null;
  const hasCashFlow =
    dashboard?.financialMetrics != null &&
    (dashboard.financialMetrics.income > 0 ||
      dashboard.financialMetrics.expense > 0);
  const headerStory = dashboard?.financialMetrics?.hasTransactions
    ? dashboard.financialMetrics.netCashFlow >= 0
      ? t("header.cashFlowStory.positive")
      : t("header.cashFlowStory.attention")
    : t("header.cashFlowStory.unavailable");

  const topBar = (
    <TopAppBar
      variant="contextual"
      eyebrow={`${t(`header.greeting.${homeGreetingPeriod()}`)} · ${t("header.eyebrow")}`}
      title={dashboard?.isDayZero ? t("header.headline.starting") : headerStory}
      subtitle={
        dashboard?.isDayZero
          ? t("header.supporting.starting")
          : t("header.dashboardSupporting")
      }
      icon={NAVIGATION_ICONS.home}
      status={
        dashboard && dashboard.openInboxCount > 0 ? (
          <HeaderPill tone="attention">
            {t("inbox.pending", { count: dashboard.openInboxCount })}
          </HeaderPill>
        ) : null
      }
      meta={
        dashboard
          ? t("header.meta.available", {
              accountCount: dashboard.accountCount,
              openInboxCount: dashboard.openInboxCount,
            })
          : t("header.meta.unavailable")
      }
    />
  );

  return (
    <Page
      testId={HOME_TEST_ID.DASHBOARD}
      topBar={topBar}
      contentClassName="gap-(--space-3)"
    >
      <HomeStatusLane kind={HomeStatusLaneKind.OFFLINE} />
      {loadFailed ? (
        <HomeStatusLane
          kind={HomeStatusLaneKind.ERROR}
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
          retryLabel={t("status.retry")}
        />
      ) : dashboard.isDayZero ? (
        <HomeDayZeroTrio />
      ) : (
        <>
          <HomePeriodTransition period={dashboard.period}>
            <HomePeriodControl />
            <HomePeriodData>
              <HomeFinancialPulse
                balance={dashboard.realBalance}
                currency={dashboard.currency}
                action={<HomeCaptureAction />}
                locale={locale}
                period={dashboard.period}
                metrics={dashboard.financialMetrics}
              />
              {hasCashFlow && dashboard.financialMetrics ? (
                <>
                  <HomeCashFlowSection
                    metrics={dashboard.financialMetrics}
                    currency={dashboard.currency}
                    locale={locale}
                  />
                  <HomeSpendingSection
                    metrics={dashboard.financialMetrics}
                    currency={dashboard.currency}
                    locale={locale}
                  />
                </>
              ) : null}
              {dashboard.activeJarCount > 0 ? (
                <KpiBlock
                  title={t("planPulse.title")}
                  description={t("planPulse.hint")}
                  variant="surface"
                  data-testid={HOME_TEST_ID.PLAN_PULSE}
                >
                  <div className="flex items-end justify-between gap-(--space-3)">
                    <div className="min-w-0">
                      <Text
                        size="lg"
                        className="font-semibold text-text-primary"
                      >
                        {t("planPulse.jarsCount", {
                          count: dashboard.activeJarCount,
                        })}
                      </Text>
                      <Text size="sm" tone="secondary">
                        {t(
                          `planPulse.allocate.${dashboard.incomeAllocateMode}`,
                        )}
                      </Text>
                    </div>
                    <Link
                      href={APP_PATH.PLAN}
                      className="shrink-0 rounded-full bg-primary-soft px-(--space-3) py-(--space-2) text-sm font-semibold text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-primary/15 active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid={HOME_TEST_ID.PLAN_LINK}
                    >
                      {t("planPulse.openPlan")}
                    </Link>
                  </div>
                </KpiBlock>
              ) : null}
              {dashboard.openInboxCount > 0 ? (
                <KpiBlock
                  title={t("inbox.title")}
                  variant="surface"
                  data-testid={HOME_TEST_ID.INBOX_BLOCK}
                >
                  <HomeInboxCta openCount={dashboard.openInboxCount} />
                </KpiBlock>
              ) : null}
            </HomePeriodData>
          </HomePeriodTransition>
        </>
      )}
    </Page>
  );
}
