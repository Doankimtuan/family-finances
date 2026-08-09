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
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { EmptyState } from "@/shared/patterns/empty-state";
import { HealthOverviewCard } from "./health-overview-card";
import { HealthViewInsightsAction } from "./health-view-insights-action";

type Props = { params: Promise<{ locale: string }> };

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
    <div className="flex min-h-full flex-col" data-testid="health-overview">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
        ) : (
          <>
            {overview.state === HealthAssessmentState.NO_VISIBLE_FACTS ? (
              <EmptyState
                title={t("states.noVisibleFactsTitle")}
                description={t("states.noVisibleFactsBody")}
              />
            ) : overview.state === HealthAssessmentState.PARTIAL ? (
              <StatusAlert
                variant="info"
                title={t("states.partialTitle")}
                description={t("states.partialBody", {
                  visible: overview.completeness.visibleSourceCount,
                  total: overview.completeness.totalSourceCount,
                })}
              />
            ) : overview.health ? (
              <HealthOverviewCard
                score={overview.health.score}
                level={overview.health.level}
              />
            ) : null}

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

            <section className="flex flex-col gap-(--space-3)">
              <SectionHeader title={t("factorsTitle")} />
              <ul className="flex flex-col gap-(--space-2)">
                <li>
                  <Text size="sm" tone="secondary">
                    {t("factors.accounts", {
                      count: overview.accountCount,
                    })}
                  </Text>
                </li>
                <li>
                  <Text size="sm" tone="secondary">
                    {t("factors.jars", { count: overview.activeJarCount })}
                  </Text>
                </li>
                <li>
                  <Text size="sm" tone="secondary">
                    {t("factors.inbox", { count: overview.openInboxCount })}
                  </Text>
                </li>
              </ul>
            </section>

            {overview.state !== HealthAssessmentState.NO_VISIBLE_FACTS ? (
              <HealthViewInsightsAction />
            ) : null}
          </>
        )}

        <Link
          href={APP_PATH.HOME}
          className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="health-back-home"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
