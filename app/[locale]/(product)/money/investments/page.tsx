import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listInvestmentListPortfolio } from "@/modules/investments/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Heading } from "@/shared/ui/heading";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { InvestmentReadError } from "./investment-read-error";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { InvestmentsOverview } from "./overview/investments-overview";

type Props = { params: Promise<{ locale: string }> };

export default async function InvestmentsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id)))
    return redirect({ href: APP_PATH.ONBOARD, locale });
  const [t, portfolio] = await Promise.all([
    getTranslations("money.investments.stitchOverview"),
    listInvestmentListPortfolio(),
  ]);

  return (
    <Page
      testId="money-investments"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          className="border-b border-border-subtle"
          title={
            <div className="flex flex-wrap items-center gap-(--space-1)">
              <Heading level={1} className="text-base leading-snug">
                {t("title")}
              </Heading>
              <StatusBadge tone={StatusBadgeTone.GROWTH}>
                {t("assetBadge")}
              </StatusBadge>
            </div>
          }
          subtitle={
            portfolio ? (
              <span className="block text-xs leading-snug">
                {t("subtitle", { count: portfolio.activeHoldings.length })}
              </span>
            ) : undefined
          }
          trailing={
            <Link
              href={APP_PATH.MONEY_INVESTMENTS_NEW}
              className="inline-flex min-h-11 items-center gap-(--space-1) rounded-full border border-primary/20 bg-primary-soft px-(--space-3) text-xs font-semibold text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="investment-overview-add"
            >
              <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
              {t("add")}
            </Link>
          }
        />
      }
    >
      <MoneyOfflineBanner />
      {portfolio ? (
        <InvestmentsOverview portfolio={portfolio} locale={locale} />
      ) : (
        <InvestmentReadError />
      )}
    </Page>
  );
}
