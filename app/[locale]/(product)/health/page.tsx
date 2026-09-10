import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHealthOverview } from "@/modules/health/application";
import {
  HealthAssessmentState,
  HealthSourceKind,
} from "@/modules/health/application/health-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MotionReveal } from "@/shared/motion";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { HealthOverviewCard } from "./health-overview-card";
import { HealthSectionTitle } from "./health-section-title";
import { HealthViewInsightsAction } from "./health-view-insights-action";
import { HealthFactRow } from "./health-fact-row";
import { HealthCoverageCard } from "./health-coverage-card";
import { HealthRetryLink } from "./health-retry-link";
import { HEALTH_FACT_ICON } from "./health-presentations";

type Props = { params: Promise<{ locale: string }> };
type HealthCopy = Awaited<ReturnType<typeof getTranslations<"health">>>;
type HealthOverview = NonNullable<
  Awaited<ReturnType<typeof getHealthOverview>>
>;

function HealthSummary({
  overview,
  t,
}: {
  overview: HealthOverview;
  t: HealthCopy;
}) {
  if (overview.state === HealthAssessmentState.NO_VISIBLE_FACTS) {
    return (
      <EmptyState
        title={t("states.noVisibleFactsTitle")}
        description={t("states.noVisibleFactsBody")}
      />
    );
  }

  if (overview.state === HealthAssessmentState.PARTIAL) {
    return (
      <StatusAlert
        variant="info"
        title={t("states.partialTitle")}
        description={t("states.partialBody", {
          visible: overview.completeness.visibleSourceCount,
          total: overview.completeness.totalSourceCount,
        })}
      />
    );
  }

  if (!overview.health) {
    return null;
  }

  return (
    <HealthOverviewCard
      title={t("chipTitle")}
      score={overview.health.score}
      levelLabel={t(`levels.${overview.health.level}`)}
      narrative={t(`narratives.${overview.health.level}`)}
      scoreMeaning={t("pulseMeaning")}
    />
  );
}

/**
 * health.overview — factual pulse + coverage + insights entry (ST-E07-002 / AC-015).
 */
export default async function HealthPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, overview] = await Promise.all([
    getTranslations("health"),
    getHealthOverview(),
  ]);

  const loadFailed = overview == null;

  return (
    <Page
      testId="health-overview"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.HOME}
          backLabel={t("backHome")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      {loadFailed ? (
        <ErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
          className="flex-none py-(--space-4)"
          action={
            <HealthRetryLink
              href={APP_PATH.HEALTH}
              label={t("retry")}
              testId="health-retry"
            />
          }
        />
      ) : (
        <MotionReveal>
          <div className="flex flex-col gap-(--space-5)">
            <Text
              size="sm"
              tone="secondary"
              className="text-pretty"
              data-testid="health-context"
            >
              {t("context")}
            </Text>

            <div data-testid="health-summary">
              <HealthSummary overview={overview} t={t} />
            </div>

            {overview.hasEmiCompletePending ? (
              <div data-testid="health-emi-celebrate">
                <StatusAlert
                  variant="info"
                  title={t("emiCelebrateTitle")}
                  description={t("emiCelebrateBody")}
                />
                <Link
                  href={APP_PATH.INBOX}
                  prefetch={PRODUCT_LINK_PREFETCH}
                  className="mt-(--space-2) inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid="health-emi-inbox-link"
                >
                  {t("insights.openInbox")}
                </Link>
              </div>
            ) : null}

            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="health-factors"
            >
              <HealthSectionTitle>{t("factorsTitle")}</HealthSectionTitle>
              <Text size="sm" tone="secondary" className="text-pretty">
                {t("factorsDescription")}
              </Text>
              <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                <ul className="divide-y divide-border-subtle/65">
                  <HealthFactRow
                    icon={HEALTH_FACT_ICON[HealthSourceKind.ACCOUNTS]}
                    label={t("factors.accounts", {
                      count: overview.accountCount,
                    })}
                    source={HealthSourceKind.ACCOUNTS}
                    sourceLabel={t("insights.sources.accounts")}
                    factor={HealthSourceKind.ACCOUNTS}
                    origin={APP_PATH.HEALTH}
                    testId="health-source-accounts"
                  />
                  <HealthFactRow
                    icon={HEALTH_FACT_ICON[HealthSourceKind.PLAN_JARS]}
                    label={t("factors.jars", {
                      count: overview.activeJarCount,
                    })}
                    source={HealthSourceKind.PLAN_JARS}
                    sourceLabel={t("insights.sources.plan_jars")}
                    factor={HealthSourceKind.PLAN_JARS}
                    origin={APP_PATH.HEALTH}
                    testId="health-source-plan_jars"
                  />
                  <HealthFactRow
                    icon={HEALTH_FACT_ICON[HealthSourceKind.INBOX]}
                    label={t("factors.inbox", {
                      count: overview.openInboxCount,
                    })}
                    source={HealthSourceKind.INBOX}
                    sourceLabel={t("insights.sources.inbox")}
                    factor={HealthSourceKind.INBOX}
                    origin={APP_PATH.HEALTH}
                    testId="health-source-inbox"
                  />
                </ul>
              </Card>
            </section>

            <HealthCoverageCard
              completeness={overview.completeness}
              copy={{
                title: t("coverageTitle"),
                body: t("states.partialBody", {
                  visible: overview.completeness.visibleSourceCount,
                  total: overview.completeness.totalSourceCount,
                }),
                missingAccounts: t("coverageMissingAccounts"),
                missingPlan: t("coverageMissingPlan"),
              }}
            />

            <Card
              tone="soft"
              className="gap-(--space-2) p-(--space-4)"
              data-testid="health-limitations"
            >
              <Text size="sm" weight="semibold" className="text-text-primary">
                {t("limitationsTitle")}
              </Text>
              <Text
                size="sm"
                tone="secondary"
                className="text-pretty leading-relaxed"
              >
                {t("limitationsBody")}
              </Text>
            </Card>

            {overview.state !== HealthAssessmentState.NO_VISIBLE_FACTS ? (
              <HealthViewInsightsAction>
                {t("viewInsights")}
              </HealthViewInsightsAction>
            ) : null}
          </div>
        </MotionReveal>
      )}
    </Page>
  );
}
