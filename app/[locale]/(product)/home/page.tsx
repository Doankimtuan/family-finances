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
import { Section } from "@/shared/patterns/section";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Page } from "@/shared/patterns/page";
import { Text } from "@/shared/ui/text";
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
 * Home is a mobile decision surface: current position, flow, spending,
 * attention, then plan. It intentionally excludes unreliable investment, savings,
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
  const topBar = (
    <TopAppBar
      variant={TopAppBarVariant.PRIMARY}
      eyebrow={t(`header.greeting.${homeGreetingPeriod()}`)}
      title={t("header.eyebrow")}
      trailing={<BrandMark variant="mark" size="sm" />}
    />
  );

  return (
    <MotionReveal className="min-h-full">
      <Page
        testId={HOME_TEST_ID.DASHBOARD}
        topBar={topBar}
        contentClassName="gap-(--space-6)"
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
              <HomePeriodData period={dashboard.period}>
                <HomeFinancialPulse
                  balance={dashboard.realBalance}
                  currency={dashboard.currency}
                  action={
                    <HomeCaptureAction accountCount={dashboard.accountCount} />
                  }
                  locale={locale}
                  period={dashboard.period}
                  metrics={dashboard.financialMetrics}
                />
                {hasCashFlow && dashboard.financialMetrics ? (
                  <Section
                    title={t("periodStory.title")}
                    contentClassName="gap-(--space-4)"
                    testId={HOME_TEST_ID.PERIOD_STORY}
                  >
                    <HomeCashFlowSection
                      metrics={dashboard.financialMetrics}
                      currency={dashboard.currency}
                      locale={locale}
                    />
                    <HomeSpendingSection
                      metrics={dashboard.financialMetrics}
                      currency={dashboard.currency}
                      locale={locale}
                      canReviewUncategorized={dashboard.canReviewUncategorized}
                    />
                  </Section>
                ) : null}
              </HomePeriodData>
              <Section
                title={t("inbox.title")}
                contentClassName="gap-(--space-3)"
                testId={HOME_TEST_ID.INBOX_BLOCK}
              >
                <HomeInboxCta openCount={dashboard.openInboxCount} />
              </Section>
              <Section
                title={t("planPulse.title")}
                description={t("planPulse.hint")}
                action={
                  <Link
                    href={APP_PATH.PLAN}
                    data-testid={HOME_TEST_ID.PLAN_LINK}
                  >
                    {t("planPulse.openPlan")}
                  </Link>
                }
                testId={HOME_TEST_ID.PLAN_PULSE}
              >
                <div className="rounded-(--radius-card) border border-border-subtle/70 bg-surface-muted/45 p-(--space-3)">
                  <div className="min-w-0">
                    <Text size="lg" className="font-semibold text-text-primary">
                      {t("planPulse.jarsCount", {
                        count: dashboard.activeJarCount,
                      })}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {t(`planPulse.allocate.${dashboard.incomeAllocateMode}`)}
                    </Text>
                  </div>
                </div>
              </Section>
            </HomePeriodTransition>
          </>
        )}
      </Page>
    </MotionReveal>
  );
}
