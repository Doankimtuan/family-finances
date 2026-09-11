import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { _Translator } from "use-intl";
import type { AppMessages } from "../../../../global";
import {
  getHomeInvestmentSummary,
  getHomeLoanSummary,
  getHomeDebtSummary,
  getHomePeriodData,
  getHomeSavingsSummary,
  HomeProductReadStatus,
  type HomeReadinessReadResult,
} from "@/modules/home/application";
import { getOpenInboxAttention } from "@/modules/inbox/application";
import {
  calculateMoneyAssetOverview,
  MoneyAssetOverviewStatus,
} from "@/modules/ledger/application";
import { getHouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { MotionReveal } from "@/shared/motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeFinancialPulse } from "./home-financial-pulse";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomePeriodControl } from "./home-period-control";
import { HomePeriodStory } from "./home-period-story";
import { HomePeriodTransition } from "./home-period-transition";
import { HomePlanPulse } from "./home-plan-pulse";
import { HomeProductSummariesStreaming } from "./home-product-summaries";
import { HomeStatusLane } from "./home-status-lane";
import {
  homeGreetingPeriod,
  HOME_DASHBOARD_DEFAULT_PERIOD,
  HOME_PERIOD_FOCUS_INTENT_KEY,
  HOME_PERIOD_FOCUS_QUERY,
  HOME_PRODUCT_FAILURE_QUERY,
  HOME_TRANSLATION_NAMESPACE,
  HomeDashboardReadStatus,
  HomeDashboardPeriod,
  HomeProductSummaryKey,
  HomeStatusLaneKind,
  HOME_TEST_ID,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "@/modules/home/application/home-constants";

type HomeTranslator = _Translator<AppMessages, "home">;

export type HomeSearchParams = Promise<
  { period?: string; focus?: string } & Record<string, string | undefined>
>;

function resolveDashboardPeriod(rawPeriod?: string): HomeDashboardPeriodValue {
  return rawPeriod === HomeDashboardPeriod.QUARTER
    ? HomeDashboardPeriod.QUARTER
    : HOME_DASHBOARD_DEFAULT_PERIOD;
}

export function HomeTopBarFallback() {
  return (
    <TopAppBar
      variant="contextual"
      showBrandMark
      eyebrow={<Skeleton className="h-4 w-28" aria-hidden />}
      title={<Skeleton className="h-9 w-48" aria-hidden />}
      subtitle={<Skeleton className="mt-(--space-1) h-4 w-60" aria-hidden />}
      meta={<Skeleton className="h-4 w-40" aria-hidden />}
    />
  );
}

export async function HomeTopBar({
  readiness,
}: {
  readiness: Promise<HomeReadinessReadResult>;
}) {
  const [readinessResult, preferences, inbox, translation] = await Promise.all([
    readiness,
    getHouseholdPreferences(),
    getOpenInboxAttention(),
    getTranslations(HOME_TRANSLATION_NAMESPACE),
  ]);
  const t: HomeTranslator = translation;
  const householdEyebrow =
    preferences?.householdName || t("header.householdContext");
  const hasAvailableMeta =
    readinessResult.status === HomeDashboardReadStatus.READY && inbox != null;

  return (
    <TopAppBar
      variant="contextual"
      showBrandMark
      eyebrow={householdEyebrow}
      title={t(`header.greeting.${homeGreetingPeriod()}`)}
      subtitle={t("header.dashboardSupporting")}
      meta={
        hasAvailableMeta
          ? t("header.meta.available", {
              accountCount: readinessResult.readiness.accountCount,
              openInboxCount: inbox.openCount,
            })
          : t("header.meta.unavailable")
      }
    />
  );
}

function HomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)" aria-hidden>
      <Card tone="hero" className="gap-0 p-(--space-4)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <Skeleton className="mt-(--space-4) h-8 w-full rounded-full" />
      </Card>
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton rows={4} />
    </div>
  );
}

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <section className="flex flex-col gap-(--space-3)">
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Card tone="elevated" className="gap-0 p-0">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
          >
            <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </Card>
    </section>
  );
}

async function HomeFinancialPulseSection({
  readiness,
  savings,
  investments,
  locale,
  t,
}: {
  readiness: Extract<
    HomeReadinessReadResult,
    { status: typeof HomeDashboardReadStatus.READY }
  >["readiness"];
  savings: ReturnType<typeof getHomeSavingsSummary>;
  investments: ReturnType<typeof getHomeInvestmentSummary>;
  locale: string;
  t: HomeTranslator;
}) {
  const [savingsResult, investmentsResult] = await Promise.all([
    savings,
    investments,
  ]);
  const assetOverview = calculateMoneyAssetOverview({
    accounts: readiness.realBalance,
    savings:
      savingsResult.status === HomeProductReadStatus.READY
        ? savingsResult.summary.principal
        : null,
    investments:
      investmentsResult.status === HomeProductReadStatus.READY
        ? {
            amount: investmentsResult.summary.marketValue,
            valuationIncluded: investmentsResult.summary.valuationIncluded,
            valuationTotal: investmentsResult.summary.valuationTotal,
          }
        : null,
  });
  const balance =
    assetOverview.status === MoneyAssetOverviewStatus.UNAVAILABLE
      ? null
      : assetOverview.total;
  const balanceNote =
    assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
      ? t("financialPulse.partial", assetOverview.investmentCoverage)
      : undefined;

  return (
    <MotionReveal>
      <HomeFinancialPulse
        balance={balance}
        balanceNote={balanceNote}
        currency={readiness.currency}
        locale={locale}
      />
    </MotionReveal>
  );
}

function HomePlanSection({
  readiness,
  t,
}: {
  readiness: Extract<
    HomeReadinessReadResult,
    { status: typeof HomeDashboardReadStatus.READY }
  >["readiness"];
  t: HomeTranslator;
}) {
  return (
    <HomePlanPulse
      title={t("planPulse.title")}
      hint={t("planPulse.hint")}
      jarsCount={t("planPulse.jarsCount", {
        count: readiness.activeJarCount,
      })}
      allocateLabel={t(`planPulse.allocate.${readiness.incomeAllocateMode}`)}
      openLabel={t("planPulse.openPlan")}
    />
  );
}

async function HomeInboxSection({
  inbox,
  t,
}: {
  inbox: ReturnType<typeof getOpenInboxAttention>;
  t: HomeTranslator;
}) {
  const result = await inbox;
  return (
    <Section
      title={t("inbox.title")}
      contentClassName="gap-(--space-3)"
      testId={HOME_TEST_ID.INBOX_BLOCK}
    >
      {result == null ? (
        <HomeStatusLane
          kind={HomeStatusLaneKind.ERROR}
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
          retryLabel={t("status.retry")}
        />
      ) : (
        <HomeInboxCta openCount={result.openCount} />
      )}
    </Section>
  );
}

async function HomePeriodSection({
  periodData,
  inbox,
  locale,
  focusIntent,
  currency,
}: {
  periodData: ReturnType<typeof getHomePeriodData>;
  inbox: ReturnType<typeof getOpenInboxAttention>;
  locale: string;
  focusIntent?: string;
  currency: string;
}) {
  const [periodResult, inboxResult] = await Promise.all([periodData, inbox]);
  if (periodResult.status === HomeDashboardReadStatus.ERROR) {
    return <HomeStatusLane kind={HomeStatusLaneKind.ERROR} />;
  }
  if (periodResult.status === HomeDashboardReadStatus.PARTIAL) {
    return <HomeStatusLane kind={HomeStatusLaneKind.PARTIAL} />;
  }

  return (
    <HomePeriodStory
      metrics={periodResult.data.financialMetrics}
      currency={currency}
      locale={locale}
      period={periodResult.data.period}
      canReviewUncategorized={inboxResult?.canReviewUncategorized ?? false}
      periodControl={
        <HomePeriodControl
          restoreFocus={focusIntent === HOME_PERIOD_FOCUS_INTENT_KEY}
        />
      }
    />
  );
}

export async function HomeContent({
  locale,
  readiness,
  searchParams,
}: {
  locale: string;
  readiness: Promise<HomeReadinessReadResult>;
  searchParams: HomeSearchParams;
}) {
  const [query, translation] = await Promise.all([
    searchParams,
    getTranslations(HOME_TRANSLATION_NAMESPACE),
  ]);
  const t: HomeTranslator = translation;
  const period = resolveDashboardPeriod(query.period);
  const productFailure = query[HOME_PRODUCT_FAILURE_QUERY];
  const inbox = getOpenInboxAttention();
  const periodData = getHomePeriodData(period);
  const savings = getHomeSavingsSummary();
  const investments = getHomeInvestmentSummary(
    productFailure === HomeProductSummaryKey.INVESTMENTS,
  );
  const loans = getHomeLoanSummary();
  const debt = getHomeDebtSummary();
  const readinessResult = await readiness;

  if (readinessResult.status === HomeDashboardReadStatus.ERROR) {
    return (
      <HomeStatusLane
        kind={HomeStatusLaneKind.ERROR}
        title={t("loadErrorTitle")}
        description={t("loadErrorBody")}
        retryLabel={t("status.retry")}
      />
    );
  }
  if (readinessResult.readiness.isDayZero) {
    return <HomeDayZeroTrio />;
  }

  return (
    <>
      <HomePeriodTransition period={period}>
        <Suspense
          fallback={
            <Card tone="hero" className="h-40" aria-hidden>
              <Skeleton className="h-full w-full" />
            </Card>
          }
        >
          <HomeFinancialPulseSection
            readiness={readinessResult.readiness}
            savings={savings}
            investments={investments}
            locale={locale}
            t={t}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeInboxSection inbox={inbox} t={t} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomePlanSection readiness={readinessResult.readiness} t={t} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomePeriodSection
            periodData={periodData}
            inbox={inbox}
            locale={locale}
            focusIntent={query[HOME_PERIOD_FOCUS_QUERY]}
            currency={readinessResult.readiness.currency}
          />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <HomeProductSummariesStreaming
            locale={locale}
            currency={readinessResult.readiness.currency}
            savings={savings}
            investments={investments}
            loans={loans}
            debt={debt}
            t={t}
          />
        </Suspense>
      </HomePeriodTransition>
      <FloatingAction>
        <HomeCaptureAction
          accountCount={readinessResult.readiness.accountCount}
        />
      </FloatingAction>
    </>
  );
}

export function HomeStreamingFallback() {
  return <HomeContentSkeleton />;
}
