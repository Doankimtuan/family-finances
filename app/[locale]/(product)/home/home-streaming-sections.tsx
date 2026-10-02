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
import { HOME_RECENT_ACTIVITY_LIMIT } from "@/modules/home/application/home-constants";
import { getOpenInboxAttention } from "@/modules/inbox/application";
import {
  calculateMoneyAssetOverview,
  MoneyAssetOverviewStatus,
} from "@/modules/ledger/application";
import { getHouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import {
  HeaderPill,
  HeaderPillTone,
  TopAppBar,
  TopAppBarVariant,
} from "@/shared/patterns/top-app-bar";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { MotionReveal } from "@/shared/motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { NAVIGATION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeFinancialPulse } from "./home-financial-pulse";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomePeriodControl } from "./home-period-control";
import { HomePeriodStory } from "./home-period-story";
import { HomePeriodTransition } from "./home-period-transition";
import { HomeProductSummariesStreaming } from "./home-product-summaries";
import { HomeRecentActivity } from "./home-recent-activity";
import { HomeStatusLane } from "./home-status-lane";
import {
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
      variant={TopAppBarVariant.PRIMARY}
      showBrandMark
      eyebrow={
        <div className="flex min-w-0 flex-col gap-(--space-1)">
          <Skeleton className="h-4 w-36" aria-hidden />
          <Skeleton className="h-3 w-48" aria-hidden />
        </div>
      }
      trailing={
        <div className="flex items-center gap-(--space-1)">
          <Skeleton className="size-11 rounded-full" aria-hidden />
          <Skeleton className="size-11 rounded-full" aria-hidden />
        </div>
      }
    />
  );
}

export async function HomeTopBar() {
  const [preferences, inbox, translation] = await Promise.all([
    getHouseholdPreferences(),
    getOpenInboxAttention(),
    getTranslations(HOME_TRANSLATION_NAMESPACE),
  ]);
  const t: HomeTranslator = translation;
  const householdEyebrow =
    preferences?.householdName || t("header.householdContext");

  return (
    <TopAppBar
      variant={TopAppBarVariant.PRIMARY}
      showBrandMark
      eyebrow={
        <div className="flex min-w-0 flex-col items-start">
          <div className="flex min-w-0 items-center gap-(--space-2)">
            <span className="truncate text-sm font-semibold text-text-primary">
              {householdEyebrow}
            </span>
            <HeaderPill
              tone={HeaderPillTone.POSITIVE}
              className="min-h-6 shrink-0 px-(--space-2) text-[11px]"
            >
              {t("header.sharedWallet")}
            </HeaderPill>
          </div>
          <p className="mt-(--space-1) text-xs font-normal text-text-muted">
            {t("header.dashboardSupporting")}
          </p>
        </div>
      }
      title={<h1 className="sr-only">{t("title")}</h1>}
      trailing={
        <div className="flex items-center gap-(--space-1)">
          <Link
            href={APP_PATH.INBOX}
            prefetch={PRODUCT_LINK_PREFETCH}
            aria-label={t("inbox.title")}
            className="relative flex size-11 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary shadow-xs transition-[background-color,border-color,color] duration-(--duration-fast) hover:border-border-default hover:text-text-primary active:scale-(--press-scale)"
          >
            <AppIcon icon={UTILITY_ICONS.notification} size="sm" />
            {inbox && inbox.openCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-warning ring-2 ring-surface" />
            ) : null}
          </Link>
          <Link
            href={APP_PATH.TOGETHER}
            prefetch={PRODUCT_LINK_PREFETCH}
            aria-label={t("header.householdMembers")}
            className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary-soft text-primary shadow-xs"
          >
            <AppIcon icon={NAVIGATION_ICONS.together} size="sm" />
          </Link>
        </div>
      }
    />
  );
}

function HomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-5)" aria-hidden>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <Skeleton className="mt-(--space-4) h-8 w-full rounded-full" />
      </Card>
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton rows={4} />
      <SectionSkeleton rows={HOME_RECENT_ACTIVITY_LIMIT} />
    </div>
  );
}

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <section className="flex flex-col gap-(--space-4) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4)">
      <div>
        <div className="flex min-h-11 items-center justify-between gap-(--space-3)">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="mt-(--space-1) h-4 w-56" />
      </div>
      <div className="flex flex-col gap-(--space-2)">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex min-h-14 items-center gap-(--space-3) rounded-(--radius-control) bg-surface-muted/55 px-(--space-3) py-(--space-3)"
          >
            <Skeleton className="size-10 shrink-0 rounded-(--radius-control)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
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
  const balanceNote = [
    t("financialPulse.hint"),
    assetOverview.status === MoneyAssetOverviewStatus.PARTIAL
      ? t("financialPulse.partial", assetOverview.investmentCoverage)
      : null,
    investmentsResult.status === HomeProductReadStatus.READY &&
    investmentsResult.summary.valuationStale
      ? t("financialPulse.stale")
      : null,
  ]
    .filter((note) => note != null)
    .join(" ");
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
      title={
        <Heading level={2} className="sr-only">
          {t("inbox.title")}
        </Heading>
      }
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
  locale,
  focusIntent,
  currency,
}: {
  periodData: ReturnType<typeof getHomePeriodData>;
  locale: string;
  focusIntent?: string;
  currency: string;
}) {
  const periodResult = await periodData;
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
            <Card tone="elevated" className="h-40" aria-hidden>
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
          <HomePeriodSection
            periodData={periodData}
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

        <Suspense
          fallback={<SectionSkeleton rows={HOME_RECENT_ACTIVITY_LIMIT} />}
        >
          <HomeRecentActivity locale={locale} />
        </Suspense>
      </HomePeriodTransition>
    </>
  );
}

export function HomeStreamingFallback() {
  return <HomeContentSkeleton />;
}
