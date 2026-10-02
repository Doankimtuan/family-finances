import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { OpeningPositionForm } from "../opening-position-form";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { listAccounts } from "@/modules/ledger/application";
import { isEligibleInvestmentCashAccount } from "@/modules/ledger/application/client";
export default async function InvestmentOpeningPage() {
  const [t, accountsResult] = await Promise.all([
    getTranslations("money.investments.opening"),
    listAccounts(),
  ]);
  const accounts = (accountsResult?.accounts ?? [])
    .filter((account) => isEligibleInvestmentCashAccount(account))
    .map((account) => ({
      id: account.id,
      name: account.name,
      balance: account.balance,
    }));
  return (
    <Page
      testId="money-investments-new"
      topBar={
        <TopAppBar
          variant="form"
          className="border-b border-border-subtle"
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={t("title")}
          subtitle={<span className="text-xs">{t("subtitle")}</span>}
          trailing={
            <Link
              href={APP_PATH.MONEY_INVESTMENTS}
              className="inline-flex min-h-11 items-center px-(--space-2) text-xs font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("design.cancel")}
            </Link>
          }
        />
      }
    >
      <OpeningPositionForm accounts={accounts} />
    </Page>
  );
}
