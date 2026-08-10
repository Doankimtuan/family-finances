import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APP_PATH, moneyInvestmentPath } from "@/modules/tenancy/application/app-path";
import { getInvestmentHolding, listInvestmentPortfolio, type InvestmentFormMode } from "@/modules/investments/application";
import { listAccounts } from "@/modules/ledger/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { InvestmentOperationForm } from "./investment-operation-form";

type Props = { mode: InvestmentFormMode; holdingId?: string };

export async function InvestmentOperationPage({ mode, holdingId }: Props) {
  const [t, portfolio, accounts, requested] = await Promise.all([
    getTranslations("money.investments.operation"),
    listInvestmentPortfolio(),
    listAccounts(),
    holdingId ? getInvestmentHolding(holdingId) : Promise.resolve(null),
  ]);
  const holding = requested ?? portfolio?.holdings[0] ?? null;
  if (!holding || !portfolio) return <Page topBar={<TopAppBar title={t(`title.${mode}`)} />}><EmptyState title={t("notAvailable")} /><Link href={APP_PATH.MONEY_INVESTMENTS} className="text-sm font-medium text-accent">{t("back")}</Link></Page>;
  return <Page testId={`investment-${mode}`} topBar={<TopAppBar title={t(`title.${mode}`)} subtitle={holding.symbol || holding.name} />}>
    <InvestmentOperationForm mode={mode} holding={holding} holdings={portfolio.holdings} accounts={(accounts?.accounts ?? []).map((account) => ({ id: account.id, name: account.name }))} />
    <Link href={moneyInvestmentPath(holding.id)} className="text-sm font-medium text-accent">{t("back")}</Link>
  </Page>;
}
