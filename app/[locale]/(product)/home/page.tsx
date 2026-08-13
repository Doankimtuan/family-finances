import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHomeDashboard } from "@/modules/home/application";
import {
  HomeStatusLaneKind,
  HOME_CURRENCY_FRACTION_DIGITS,
  homeGreetingPeriod,
  HOME_TEST_ID,
  HOME_TRANSLATION_NAMESPACE,
} from "@/modules/home/application/home-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { HeaderPill, TopAppBar } from "@/shared/patterns/top-app-bar";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { Balance } from "@/shared/patterns/balance";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { Page } from "@/shared/patterns/page";
import { Text } from "@/shared/ui/text";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomeHealthChip } from "./home-health-chip";
import { HomeDayZeroTrio } from "./home-day-zero-trio";
import { HomeStatusLane } from "./home-status-lane";

type Props = { params: Promise<{ locale: string }> };

/**
 * home.index — three answers + Health chip (ST-E07-001 / AC-001 / AC-015 / BR-01).
 */
export default async function HomePage({ params }: Props) {
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

  const [t, dashboard] = await Promise.all([
    getTranslations(HOME_TRANSLATION_NAMESPACE),
    getHomeDashboard(),
  ]);

  const loadFailed = dashboard == null;

  const topBar = (
    <TopAppBar
      variant="contextual"
      eyebrow={`${t(`header.greeting.${homeGreetingPeriod()}`)} · ${t("header.eyebrow")}`}
      title={
        dashboard ? t(`header.headline.${dashboard.health.level}`) : t("title")
      }
      subtitle={
        dashboard
          ? t(`header.supporting.${dashboard.health.level}`)
          : t("header.meta.unavailable")
      }
      icon={NAVIGATION_ICONS.home}
      status={
        dashboard ? (
          <HeaderPill
            tone={
              dashboard.health.level === "strong"
                ? "positive"
                : dashboard.health.level === "steady"
                  ? "info"
                  : "neutral"
            }
          >
            {t(`health.levels.${dashboard.health.level}`)}
          </HeaderPill>
        ) : null
      }
      meta={
        dashboard
          ? t("header.meta.available", {
              accountCount: dashboard.accountCount,
              openInboxCount: dashboard.openInboxCount,
            })
          : t("header.meta.unavailable")
      }
    />
  );

  return (
    <Page testId={HOME_TEST_ID.DASHBOARD} topBar={topBar}>
      <HomeStatusLane kind={HomeStatusLaneKind.OFFLINE} />

      {loadFailed ? (
        <HomeStatusLane
          kind={HomeStatusLaneKind.ERROR}
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
          retryLabel={t("status.retry")}
        />
      ) : (
        <>
          <KpiBlock
            title={t("realPosition.title")}
            description={t("realPosition.hint")}
            variant="prominent"
            data-testid={HOME_TEST_ID.REAL_POSITION}
          >
            <Balance
              amountLabel={formatCurrency(
                dashboard.realBalance,
                dashboard.currency,
                locale,
                { maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS },
              )}
              size="lg"
              amountClassName="text-[2.5rem] leading-none"
            />
            {!dashboard.isDayZero ? <HomeCaptureAction /> : null}
          </KpiBlock>

          <KpiBlock
            title={t("planPulse.title")}
            description={t("planPulse.hint")}
            variant="surface"
            data-testid={HOME_TEST_ID.PLAN_PULSE}
          >
            <div className="flex items-end justify-between gap-(--space-3)">
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
              <Link
                href={APP_PATH.PLAN}
                className="shrink-0 rounded-full bg-primary-soft px-(--space-3) py-(--space-2) text-sm font-semibold text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-primary/15 active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid={HOME_TEST_ID.PLAN_LINK}
              >
                {t("planPulse.openPlan")}
              </Link>
            </div>
          </KpiBlock>

          <KpiBlock
            title={t("inbox.title")}
            variant="surface"
            data-testid={HOME_TEST_ID.INBOX_BLOCK}
          >
            <HomeInboxCta openCount={dashboard.openInboxCount} />
          </KpiBlock>

          <HomeHealthChip
            score={dashboard.health.score}
            level={dashboard.health.level}
          />

          {dashboard.isDayZero ? <HomeDayZeroTrio /> : null}
        </>
      )}
    </Page>
  );
}
