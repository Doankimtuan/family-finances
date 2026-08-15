import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { listInvestmentPortfolio } from "@/modules/investments/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InvestmentOverviewClient } from "./investment-overview-client";

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
    getTranslations("money.investments.overview"),
    listInvestmentPortfolio(),
  ]);
  return (
    <Page
      testId="money-investments"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      {!portfolio ? (
        <StatusAlert variant="danger" title={t("loadError")} />
      ) : portfolio.activeHoldings.length === 0 &&
        portfolio.closedHoldings.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <InvestmentOverviewClient portfolio={portfolio} locale={locale} />
      )}
      <Link href={APP_PATH.MONEY} className="text-sm font-medium text-accent">
        {t("back")}
      </Link>
    </Page>
  );
}
