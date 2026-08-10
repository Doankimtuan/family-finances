import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { APP_PATH, moneyInvestmentPath } from "@/modules/tenancy/application/app-path";
import { listInvestmentPortfolio } from "@/modules/investments/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";

type Props = { params: Promise<{ locale: string }> };

export default async function InvestmentsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) return redirect({ href: APP_PATH.ONBOARD, locale });
  const [t, portfolio] = await Promise.all([
    getTranslations("money.investments.overview"),
    listInvestmentPortfolio(),
  ]);
  const money = (value: number | null) => value == null ? t("unavailable") : formatCurrency(value, "VND", locale, { maximumFractionDigits: 0 });
  return (
    <Page testId="money-investments" topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}>
      {!portfolio ? <StatusAlert variant="danger" title={t("loadError")} /> : portfolio.holdings.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : <>
        <Section title={t("portfolioTitle")} testId="investment-portfolio-summary">
          <Amount size="lg" label={t("currentValue")} amountLabel={money(portfolio.totalCurrentValue)} />
          <div className="grid grid-cols-2 gap-(--space-3)">
            <Amount label={t("knownBasis")} amountLabel={money(portfolio.totalRemainingCostBasis)} />
            <Amount label={t("unrealized")} amountLabel={money(portfolio.unrealizedResult)} />
            <Amount label={t("realized")} amountLabel={money(portfolio.realizedSaleResult)} />
            <Amount label={t("income")} amountLabel={money(portfolio.investmentIncome)} />
            <Amount label={t("fees")} amountLabel={money(portfolio.investmentFees)} />
          </div>
          {portfolio.basisCoverage.included < portfolio.basisCoverage.total ? <StatusAlert variant="warning" title={t("basisCoverage", portfolio.basisCoverage)} /> : null}
          {portfolio.valuationCoverage.included < portfolio.valuationCoverage.total ? <StatusAlert variant="warning" title={t("valuationCoverage", portfolio.valuationCoverage)} /> : null}
        </Section>
        {portfolio.allocationByAssetClass.length ? <Section title={t("allocationTitle")}>
          <dl className="flex flex-col gap-(--space-3)">{portfolio.allocationByAssetClass.map((row) => <div key={row.assetClass} className="flex justify-between gap-(--space-3)"><Text size="sm">{t(`assetClass.${row.assetClass}`)}</Text><Text size="sm" className="font-medium tabular-nums">{money(row.valueVnd)} ({(row.shareBasisPoints / 100).toFixed(2)}%)</Text></div>)}</dl>
        </Section> : null}
        <Section title={t("holdingsTitle")}>
          <ul className="flex flex-col gap-(--space-2)">{portfolio.holdings.map((holding) => <li key={holding.id}><Link href={moneyInvestmentPath(holding.id)} className="block rounded-md border border-border-subtle bg-surface p-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" data-testid={`investment-holding-${holding.id}`}><div className="flex items-start justify-between gap-(--space-3)"><Text size="sm" className="font-medium">{holding.symbol || holding.name}</Text><Text size="sm" tone="secondary">{holding.quantity}</Text></div><Text size="sm" tone="secondary">{holding.providerCustodian || t("noProvider")}</Text><Amount className="mt-(--space-2)" label={t("currentValue")} amountLabel={money(holding.currentValue)} /></Link></li>)}</ul>
        </Section>
      </>}
      <div className="grid grid-cols-2 gap-(--space-2)">
        <Link href={APP_PATH.MONEY_INVESTMENTS_NEW} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-(--space-3) text-sm font-medium text-accent-fg" data-testid="investment-opening-link">{t("addOpening")}</Link>
        <Link href={APP_PATH.MONEY_INVESTMENTS_CONVERT} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary">{t("convert")}</Link>
      </div>
      <Link href={APP_PATH.MONEY} className="text-sm font-medium text-accent">{t("back")}</Link>
    </Page>
  );
}
