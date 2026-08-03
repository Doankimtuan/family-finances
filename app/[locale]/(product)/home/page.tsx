import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHomeDashboard } from "@/modules/home/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Balance } from "@/shared/patterns/balance";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { HomeCaptureAction } from "./home-capture-action";
import { HomeInboxCta } from "./home-inbox-cta";
import { HomeHealthChip } from "./home-health-chip";
import { HomeDayZeroTrio } from "./home-day-zero-trio";

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
    getTranslations("home"),
    getHomeDashboard(),
  ]);

  const loadFailed = dashboard == null;

  return (
    <div className="flex min-h-full flex-col" data-testid="home-dashboard">
      <TopAppBar
        title={
          <div className="flex min-w-0 items-center gap-(--space-2)">
            <BrandMark variant="mark" size="sm" className="shrink-0" />
            <Heading
              level={1}
              className="truncate text-lg font-semibold tracking-tight text-text-primary"
            >
              {t("title")}
            </Heading>
          </div>
        }
        subtitle={t("subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
        ) : (
          <>
            <KpiBlock
              title={t("realPosition.title")}
              description={t("realPosition.hint")}
              data-testid="home-real-position"
            >
              <Balance
                amountLabel={formatCurrency(
                  dashboard.realBalance,
                  dashboard.currency,
                  locale,
                  { maximumFractionDigits: 0 },
                )}
                size="lg"
              />
              {!dashboard.isDayZero ? <HomeCaptureAction /> : null}
            </KpiBlock>

            <KpiBlock
              title={t("planPulse.title")}
              description={t("planPulse.hint")}
              data-testid="home-plan-pulse"
            >
              <Text size="sm" className="font-medium text-text-primary">
                {t("planPulse.jarsCount", {
                  count: dashboard.activeJarCount,
                })}
              </Text>
              <Text size="sm" tone="secondary">
                {t(`planPulse.allocate.${dashboard.incomeAllocateMode}`)}
              </Text>
              <Link
                href={APP_PATH.PLAN}
                className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="home-plan-link"
              >
                {t("planPulse.openPlan")}
              </Link>
            </KpiBlock>

            <KpiBlock title={t("inbox.title")} data-testid="home-inbox-block">
              <HomeInboxCta openCount={dashboard.openInboxCount} />
            </KpiBlock>

            <HomeHealthChip
              score={dashboard.health.score}
              level={dashboard.health.level}
            />

            {dashboard.isDayZero ? <HomeDayZeroTrio /> : null}
          </>
        )}
      </div>
    </div>
  );
}
