import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHealthDetail } from "@/modules/health/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { HealthAssessmentState } from "@/modules/health/application/health-constants";
import { HealthSectionTitle } from "../health-section-title";
import { HealthSourceLink } from "./health-source-link";

type Props = { params: Promise<{ locale: string }> };

function HealthSupportingItem({
  title,
  body,
  footer,
  testId,
}: {
  title: string;
  body: string;
  footer?: ReactNode;
  testId: string;
}) {
  return (
    <li className="px-(--space-4) py-(--space-3)" data-testid={testId}>
      <Text size="sm" weight="medium" className="text-text-primary">
        {title}
      </Text>
      <Text
        size="sm"
        tone="secondary"
        className="mt-(--space-1) leading-relaxed"
      >
        {body}
      </Text>
      {footer}
    </li>
  );
}

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
    <Page
      testId="health-insights"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.HEALTH}
          backLabel={t("insights.backHealth")}
          title={t("insights.title")}
          subtitle={t("insights.subtitle")}
        />
      }
    >
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
            <HealthSectionTitle>
              {t("insights.sectionInsights")}
            </HealthSectionTitle>
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              <ul className="divide-y divide-border-subtle/65">
                {insights.map((insight) => (
                  <HealthSupportingItem
                    key={insight.kind}
                    testId={`health-insight-${insight.kind}`}
                    title={t(`insights.items.${insight.kind}.title`)}
                    body={t(
                      `insights.items.${insight.kind}.body`,
                      insight.params,
                    )}
                    footer={
                      insight.source ? (
                        <HealthSourceLink
                          source={insight.source}
                          label={t(`insights.sources.${insight.source}`)}
                          factor={insight.kind}
                          testId={`health-source-${insight.kind}`}
                        />
                      ) : null
                    }
                  />
                ))}
              </ul>
            </Card>
          </section>

          <section
            className="flex flex-col gap-(--space-3)"
            data-testid="health-scenario-list"
          >
            <HealthSectionTitle>
              {t("insights.sectionScenarios")}
            </HealthSectionTitle>
            <Text size="sm" tone="secondary">
              {t("insights.scenarioReadOnly")}
            </Text>
            <Card tone="soft" className="gap-0 overflow-hidden p-0">
              <ul className="divide-y divide-border-subtle/65">
                {scenarios.map((scenario) => (
                  <HealthSupportingItem
                    key={scenario.kind}
                    testId={`health-scenario-${scenario.kind}`}
                    title={t(`insights.scenarios.${scenario.kind}.title`)}
                    body={t(
                      `insights.scenarios.${scenario.kind}.body`,
                      scenario.params,
                    )}
                  />
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}
    </Page>
  );
}
