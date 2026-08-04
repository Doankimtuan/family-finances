import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { EmergencyInboxBanner } from "./emergency-inbox-banner";

type Props = { params: Promise<{ locale: string }> };

/**
 * plan.hub — Intention home + teach real≠virtual (ST-E05-001).
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

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-hub">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <EmergencyInboxBanner
          items={inboxItems ?? []}
          viewerUserId={user.id}
          title={t("jars.reallocate.emergencyBannerTitle")}
          body={t("jars.reallocate.emergencyBannerBody")}
          openLabel={t("jars.reallocate.emergencyBannerOpen")}
        />

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

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
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
          />
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
                    <Card
                      className="gap-0 p-(--space-4)"
                      data-testid={`plan-jar-${jar.id}`}
                    >
                      <div className="flex items-center justify-between gap-(--space-3)">
                        <div className="min-w-0">
                          <Text
                            size="sm"
                            className="truncate font-medium text-text-primary"
                          >
                            {localizeCatalogName(tCatalog, "jars", jar.name)}
                          </Text>
                          <Text size="sm" tone="secondary">
                            {t(`jars.kinds.${jar.kind}`)}
                          </Text>
                        </div>
                        <span className="shrink-0 rounded-md border border-border-subtle px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary">
                          {t("jars.stateActive")}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-(--space-2)">
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
        </section>

        <section className="flex flex-col gap-(--space-3)">
          <Card
            className="gap-(--space-3) p-(--space-4)"
            data-testid="plan-ritual-cta"
          >
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
          </Card>
        </section>
      </div>
    </div>
  );
}
