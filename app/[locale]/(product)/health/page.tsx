import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHealthOverview } from "@/modules/health/application";
import { HealthAssessmentState } from "@/modules/health/application/health-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { EmptyState } from "@/shared/patterns/empty-state";
import { HealthOverviewCard } from "./health-overview-card";
import { HealthSectionTitle } from "./health-section-title";
import { HealthViewInsightsAction } from "./health-view-insights-action";

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
    />
  );
}

/**
 * health.overview — score + narrative + insights entry (ST-E07-002 / AC-015).
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
        <StatusAlert
          variant="danger"
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
        />
      ) : (
        <>
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
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              <ul className="divide-y divide-border-subtle/65">
                <li className="px-(--space-4) py-(--space-3)">
                  <Text size="sm" tone="secondary">
                    {t("factors.accounts", {
                      count: overview.accountCount,
                    })}
                  </Text>
                </li>
                <li className="px-(--space-4) py-(--space-3)">
                  <Text size="sm" tone="secondary">
                    {t("factors.jars", { count: overview.activeJarCount })}
                  </Text>
                </li>
                <li className="px-(--space-4) py-(--space-3)">
                  <Text size="sm" tone="secondary">
                    {t("factors.inbox", { count: overview.openInboxCount })}
                  </Text>
                </li>
              </ul>
            </Card>
          </section>

          {overview.state !== HealthAssessmentState.NO_VISIBLE_FACTS ? (
            <HealthViewInsightsAction />
          ) : null}
        </>
      )}
    </Page>
  );
}
