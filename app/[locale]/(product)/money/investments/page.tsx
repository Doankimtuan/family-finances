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
import { InvestmentOverviewClient } from "./investment-overview-client";
import { InvestmentReadError } from "./investment-read-error";
import { MoneyOfflineBanner } from "../money-offline-banner";

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
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      {!portfolio ? (
        <InvestmentReadError />
      ) : portfolio.activeHoldings.length === 0 &&
        portfolio.closedHoldings.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link
              href={APP_PATH.MONEY_INVESTMENTS_NEW}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="investment-opening-link"
            >
              {t("addOpening")}
            </Link>
          }
        />
      ) : (
        <InvestmentOverviewClient portfolio={portfolio} locale={locale} />
      )}
    </Page>
  );
}
