import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APP_PATH, moneyInvestmentBuyPath, moneyInvestmentIncomePath, moneyInvestmentSellPath, moneyInvestmentValuationPath } from "@/modules/tenancy/application/app-path";
import { getInvestmentHolding, listInvestmentActivities } from "@/modules/investments/application";
import { deriveSlippage } from "@/modules/investments/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";

type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<{ receipt?: string }> };

export default async function InvestmentDetailPage({ params, searchParams }: Props) {
  const [{ locale }, { receipt }, t, holding, activities] = await Promise.all([params, searchParams, getTranslations("money.investments.detail"), params.then(({ id }) => getInvestmentHolding(id)), params.then(({ id }) => listInvestmentActivities(id))]);
  if (!holding) return <Page topBar={<TopAppBar title={t("title")} />}><EmptyState title={t("notFound")} /><Link href={APP_PATH.MONEY_INVESTMENTS} className="text-sm font-medium text-accent">{t("back")}</Link></Page>;
  const money = (value: number | null) => value == null ? t("unavailable") : formatCurrency(value, "VND", locale, { maximumFractionDigits: 0 });
  const average = holding.remainingTotalCostBasis == null || Number(holding.quantity) === 0 ? null : holding.remainingTotalCostBasis / Number(holding.quantity);
  return <Page testId="investment-detail" topBar={<TopAppBar title={holding.symbol || holding.name} subtitle={holding.providerCustodian || t("noProvider")} />}>
    {receipt ? <StatusAlert variant="success" title={t("receiptSaved")} description={t("correlation", { id: receipt })} /> : null}
    {holding.historyStatus === "cost_basis_unknown" ? <StatusAlert variant="warning" title={t("basisUnknown")} /> : null}
    <Section title={t("positionTitle")}>
      <Text size="sm" tone="secondary">{t("quantity", { quantity: holding.quantity })}</Text>
      <Amount label={t("basis")} amountLabel={money(holding.remainingTotalCostBasis)} />
      <Amount label={t("averageCost")} amountLabel={money(average == null ? null : Math.round(average))} />
      <Amount label={t("currentValue")} amountLabel={money(holding.currentValue)} />
      <Amount label={t("unrealized")} amountLabel={money(holding.unrealizedResult)} />
      <Text size="sm" tone="secondary">{t("status", { status: t(`lifecycle.${holding.lifecycleStatus}`) })}</Text>
    </Section>
    <div className="grid grid-cols-2 gap-(--space-2)">
      <Link href={moneyInvestmentBuyPath(holding.id)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg">{t("buy")}</Link>
      <Link href={moneyInvestmentSellPath(holding.id)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary">{t("sell")}</Link>
      <Link href={moneyInvestmentIncomePath(holding.id)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary">{t("income")}</Link>
      <Link href={moneyInvestmentValuationPath(holding.id)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary">{t("valuation")}</Link>
    </div>
    <Section title={t("activityTitle")}>
      {!activities?.length ? <Text size="sm" tone="secondary">{t("activityEmpty")}</Text> : <ul className="flex flex-col gap-(--space-3)">{activities.map((activity) => { const slippage = activity.executedValueVnd == null ? null : deriveSlippage({ quotedValue: activity.quotedValueVnd, executedValue: activity.executedValueVnd }); return <li key={activity.id} className="rounded-md border border-border-subtle p-(--space-3)"><div className="flex justify-between gap-(--space-3)"><Text size="sm" className="font-medium">{t(`operation.${activity.type}`)}</Text><Text size="sm" tone="secondary">{activity.effectiveDate}</Text></div><Text size="sm" tone="secondary">{t("correlation", { id: activity.correlationId })}</Text>{activity.realizedResultVnd != null ? <Amount label={t("realized")} amountLabel={money(activity.realizedResultVnd)} /> : null}{slippage != null ? <Amount label={t("slippage")} amountLabel={money(slippage)} /> : null}</li>; })}</ul>}
    </Section>
    <Link href={APP_PATH.MONEY_INVESTMENTS} className="text-sm font-medium text-accent">{t("back")}</Link>
  </Page>;
}
