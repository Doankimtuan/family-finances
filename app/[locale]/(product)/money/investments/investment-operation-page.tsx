import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import {
  getInvestmentHolding,
  listInvestmentPortfolio,
  InvestmentFormMode,
} from "@/modules/investments/application";
import type { InvestmentFormMode as InvestmentFormModeValue } from "@/modules/investments/application";
import { investmentUxConfig } from "@/modules/investments/application/investment-ux";
import { listAccounts } from "@/modules/ledger/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { InvestmentOperationForm } from "./investment-operation-form";
import { InvestmentOperationSheet } from "./investment-operation-sheet";

type Props = { mode: InvestmentFormModeValue; holdingId?: string };

export async function InvestmentOperationPage({ mode, holdingId }: Props) {
  const [t, tUx, portfolio, accounts, requested] = await Promise.all([
    getTranslations("money.investments.operation"),
    getTranslations("money.investments"),
    listInvestmentPortfolio(),
    listAccounts(),
    holdingId ? getInvestmentHolding(holdingId) : Promise.resolve(null),
  ]);
  const operationHoldings =
    mode === InvestmentFormMode.CONVERSION
      ? (portfolio?.holdings.filter((item) => item.ownership.canMutate) ?? [])
      : (portfolio?.holdings ?? []);
  const holding = requested ?? operationHoldings[0] ?? null;
  const ux = holding ? investmentUxConfig(holding.assetClass) : null;
  const operationTitle =
    mode === InvestmentFormMode.BUY
      ? ux
        ? tUx(ux.purchaseActionKey)
        : undefined
      : mode === InvestmentFormMode.SELL
        ? ux
          ? tUx(ux.disposalActionKey)
          : undefined
        : t(`title.${mode}`);
  const backHref = holdingId
    ? moneyInvestmentPath(holdingId)
    : APP_PATH.MONEY_INVESTMENTS;
  if (!holding || !portfolio)
    return (
      <Page
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="form"
            backHref={APP_PATH.MONEY_INVESTMENTS}
            title={operationTitle}
          />
        }
      >
        <EmptyState
          title={t("notAvailable")}
          className="flex-none py-(--space-4)"
          icon={
            <AppIcon
              icon={FINANCE_ICONS.investment}
              size={AppIconSize.DISPLAY}
            />
          }
          action={
            <Link
              href={APP_PATH.MONEY_INVESTMENTS}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
            >
              {t("back")}
            </Link>
          }
        />
      </Page>
    );
  if (
    mode === InvestmentFormMode.VALUATION &&
    holding.instrument?.autoPriceSupported
  )
    return (
      <Page
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="form"
            backHref={moneyInvestmentPath(holding.id)}
            title={operationTitle}
          />
        }
      >
        <StatusAlert variant="info" title={t("automaticPricingActive")} />
        <Link
          href={moneyInvestmentPath(holding.id)}
          className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-accent"
        >
          {t("back")}
        </Link>
      </Page>
    );
  return (
    <Page
      testId={`investment-${mode}`}
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="form"
          backHref={backHref}
          title={t(`title.${mode}`)}
          subtitle={holding.symbol || holding.name}
        />
      }
    >
      <FinancialOwnershipBadge
        financialScope={holding.ownership.financialScope}
        isOwnedByMe={holding.ownership.isOwnedByMe}
        ownerStatus={holding.ownership.ownerStatus}
        showExplanation
      />
      {!holding.ownership.canMutate ? (
        <>
          <StatusAlert variant="info" title={t("partnerReadOnly")} />
          <Link
            href={moneyInvestmentPath(holding.id)}
            className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </>
      ) : (
        <InvestmentOperationSheet>
          <InvestmentOperationForm
            mode={mode}
            title={operationTitle ?? t(`title.${mode}`)}
            holding={holding}
            holdings={operationHoldings}
            accounts={(accounts?.accounts ?? []).map((account) => ({
              id: account.id,
              name: account.name,
              balance: account.balance,
            }))}
          />
        </InvestmentOperationSheet>
      )}
    </Page>
  );
}
