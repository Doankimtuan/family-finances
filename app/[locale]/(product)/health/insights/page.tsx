import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHealthDetail } from "@/modules/health/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { HealthAssessmentState } from "@/modules/health/application/health-constants";
import { HealthSourceLink } from "./health-source-link";

type Props = { params: Promise<{ locale: string }> };

/**
 * health.insights — light notices + scenarios (ST-E07-002 / AC-017 / BR-14).
 */
export default async function HealthInsightsPage({ params }: Props) {
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

  const [t, detail] = await Promise.all([
    getTranslations("health"),
    getHealthDetail(),
  ]);

  const loadFailed = detail == null;
  const insights = detail?.insights ?? [];
  const scenarios = detail?.scenarios ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="health-insights">
      <TopAppBar
        title={t("insights.title")}
        subtitle={t("insights.subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("insights.loadErrorTitle")}
            description={t("insights.loadErrorBody")}
          />
        ) : detail.state === HealthAssessmentState.NO_VISIBLE_FACTS ? (
          <EmptyState
            title={t("insights.emptyTitle")}
            description={t("insights.emptyDescription")}
          />
        ) : (
          <>
            {detail.state === HealthAssessmentState.PARTIAL ? (
              <StatusAlert
                variant="info"
                title={t("states.partialTitle")}
                description={t("states.partialBody", {
                  visible: detail.completeness.visibleSourceCount,
                  total: detail.completeness.totalSourceCount,
                })}
              />
            ) : null}
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="health-insight-list"
            >
              <SectionHeader title={t("insights.sectionInsights")} />
              <ul className="flex flex-col gap-(--space-2)">
                {insights.map((insight) => (
                  <li key={insight.kind}>
                    <Card
                      className="gap-0 p-(--space-4)"
                      data-testid={`health-insight-${insight.kind}`}
                    >
                      <Text size="sm" className="font-medium text-text-primary">
                        {t(`insights.items.${insight.kind}.title`)}
                      </Text>
                      <Text
                        size="sm"
                        tone="secondary"
                        className="mt-(--space-1) leading-relaxed"
                      >
                        {t(
                          `insights.items.${insight.kind}.body`,
                          insight.params,
                        )}
                      </Text>
                      {insight.source ? (
                        <HealthSourceLink
                          source={insight.source}
                          label={t(`insights.sources.${insight.source}`)}
                          factor={insight.kind}
                          testId={`health-source-${insight.kind}`}
                        />
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>

            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="health-scenario-list"
            >
              <SectionHeader title={t("insights.sectionScenarios")} />
              <Text size="sm" tone="secondary">
                {t("insights.scenarioReadOnly")}
              </Text>
              <ul className="flex flex-col gap-(--space-2)">
                {scenarios.map((scenario) => (
                  <li key={scenario.kind}>
                    <Card
                      className="gap-0 p-(--space-4)"
                      data-testid={`health-scenario-${scenario.kind}`}
                    >
                      <Text size="sm" className="font-medium text-text-primary">
                        {t(`insights.scenarios.${scenario.kind}.title`)}
                      </Text>
                      <Text
                        size="sm"
                        tone="secondary"
                        className="mt-(--space-1) leading-relaxed"
                      >
                        {t(
                          `insights.scenarios.${scenario.kind}.body`,
                          scenario.params,
                        )}
                      </Text>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Link
          href={APP_PATH.HEALTH}
          className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="health-insights-back"
        >
          {t("insights.backHealth")}
        </Link>
      </div>
    </div>
  );
}
