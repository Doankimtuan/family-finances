import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import {
  getInvestmentHolding,
  listInvestmentPortfolio,
  type InvestmentFormMode,
} from "@/modules/investments/application";
import { investmentUxConfig } from "@/modules/investments/application/investment-ux";
import { listAccounts } from "@/modules/ledger/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
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
  const ux = holding ? investmentUxConfig(holding.assetClass) : null;
  const operationTitle =
    mode === "buy"
      ? ux?.purchaseAction
      : mode === "sell"
        ? ux?.disposalAction
        : t(`title.${mode}`);
  if (!holding || !portfolio)
    return (
      <Page topBar={<TopAppBar title={operationTitle} />}>
        <EmptyState title={t("notAvailable")} />
        <Link
          href={APP_PATH.MONEY_INVESTMENTS}
          className="text-sm font-medium text-accent"
        >
          {t("back")}
        </Link>
      </Page>
    );
  return (
    <Page
      testId={`investment-${mode}`}
      topBar={
        <TopAppBar
          title={t(`title.${mode}`)}
          subtitle={holding.symbol || holding.name}
        />
      }
    >
      <FinancialOwnershipBadge
        financialScope={holding.ownership.financialScope}
        isOwnedByMe={holding.ownership.isOwnedByMe}
      />
      {!holding.ownership.canMutate ? (
        <StatusAlert variant="info" title={t("partnerReadOnly")} />
      ) : (
        <InvestmentOperationForm
          mode={mode}
          holding={holding}
          holdings={portfolio.holdings}
          accounts={(accounts?.accounts ?? []).map((account) => ({
            id: account.id,
            name: account.name,
          }))}
        />
      )}
      <Link
        href={moneyInvestmentPath(holding.id)}
        className="text-sm font-medium text-accent"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
