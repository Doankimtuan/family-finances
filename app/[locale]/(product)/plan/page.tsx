import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getPlanPulse,
  currentPeriodMonth,
  formatPeriodLabel,
} from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { JarCard } from "@/shared/patterns/jar-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { EmergencyInboxBanner } from "./emergency-inbox-banner";
import { PlanOfflineBanner } from "./plan-offline-banner";

type Props = { params: Promise<{ locale: string }> };

/**
 * plan.hub — Intention home + teach real≠virtual (ST-E05-001 / F3).
 */
export default async function PlanHubPage({ params }: Props) {
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

  const [t, tCatalog, pulse, inboxItems] = await Promise.all([
    getTranslations("plan"),
    getTranslations("catalog"),
    getPlanPulse(),
    listOpenInboxItems(),
  ]);

  const activeJars = pulse?.activeJars ?? [];
  const previewJars = activeJars.slice(0, 4);
  const ritualMode = pulse?.monthCloseMode ?? "assisted";
  const periodLabel = formatPeriodLabel(currentPeriodMonth());

  return (
    <Page
      testId="plan-hub"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <PlanOfflineBanner />
      <EmergencyInboxBanner
        items={inboxItems ?? []}
        viewerUserId={user.id}
        title={t("jars.reallocate.emergencyBannerTitle")}
        body={t("jars.reallocate.emergencyBannerBody")}
        openLabel={t("jars.reallocate.emergencyBannerOpen")}
      />

      <Section variant="emphasized" testId="plan-period-pulse">
        <Text size="sm" tone="secondary">
          {t("period.heading", { period: periodLabel })}
        </Text>
        <Text size="sm" className="font-medium text-text-primary">
          {t("period.summary", {
            active: String(activeJars.length),
            paused: String(pulse?.pausedJarCount ?? 0),
          })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("ritual.modeLabel", {
            mode: t(`ritual.modes.${ritualMode}`),
          })}
        </Text>
      </Section>

      <div data-testid="plan-teaching">
        <StatusAlert
          variant="info"
          title={t("teaching.title")}
          description={t("teaching.body")}
        />
      </div>

      <Link
        href={APP_PATH.MONEY}
        className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="plan-money-link"
      >
        {t("moneyLink")}
      </Link>

      <Section
        title={t("jars.title")}
        action={
          <Link
            href={APP_PATH.PLAN_JARS}
            className="text-sm font-medium text-accent"
            data-testid="plan-see-jars"
          >
            {t("jars.seeAll")}
          </Link>
        }
      >
        <Text size="sm" tone="secondary">
          {t("jars.subtitle")}
        </Text>
        {previewJars.length === 0 ? (
          <EmptyState
            title={t("jars.emptyTitle")}
            description={t("jars.emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {previewJars.map((jar) => (
              <li key={jar.id}>
                <Link
                  href={planJarPath(jar.id)}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <JarCard
                    name={localizeCatalogName(tCatalog, "jars", jar.name)}
                    kindLabel={t(`jars.kinds.${jar.kind}`)}
                    stateLabel={t("jars.stateActive")}
                    state={jar.state}
                    data-testid={`plan-jar-${jar.id}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <Link
          href={APP_PATH.PLAN_GOALS}
          className="block rounded-lg border border-border-subtle bg-surface p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-entry-goals"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("goals.title")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("goals.body")}
          </Text>
          <Text size="sm" className="mt-(--space-2) font-medium text-accent">
            {t("goals.cta")}
          </Text>
        </Link>

        <Link
          href={APP_PATH.PLAN_RECURRING}
          className="block rounded-lg border border-border-subtle bg-surface p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-entry-recurring"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("recurring.title")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("recurring.body")}
          </Text>
          <Text size="sm" className="mt-(--space-2) font-medium text-accent">
            {t("recurring.cta")}
          </Text>
        </Link>

        <Link
          href={APP_PATH.PLAN_CALENDAR}
          className="block rounded-lg border border-border-subtle bg-surface p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-entry-calendar"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("calendar.title")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("calendar.body")}
          </Text>
          <Text size="sm" className="mt-(--space-2) font-medium text-accent">
            {t("calendar.cta")}
          </Text>
        </Link>
      </Section>

      <Section variant="surface" testId="plan-ritual-cta">
        <div>
          <Text size="sm" className="font-semibold text-text-primary">
            {t("ritual.title")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("ritual.body")}
          </Text>
          <Text size="sm" tone="secondary" className="mt-(--space-2)">
            {t("ritual.modeLabel", {
              mode: t(`ritual.modes.${ritualMode}`),
            })}
          </Text>
        </div>
        <Link
          href={APP_PATH.PLAN_RITUAL}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-ritual-open"
        >
          {t("ritual.cta")}
        </Link>
      </Section>
    </Page>
  );
}
