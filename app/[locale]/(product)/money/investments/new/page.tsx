import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { OpeningPositionForm } from "../opening-position-form";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { listAccounts } from "@/modules/ledger/application";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
export default async function InvestmentOpeningPage() {
  const [t, accountsResult] = await Promise.all([
    getTranslations("money.investments.opening"),
    listAccounts(),
  ]);
  const accounts = (accountsResult?.accounts ?? [])
    .filter((account) => account.type !== AccountType.SAVINGS_PRODUCT)
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
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <OpeningPositionForm accounts={accounts} />
    </Page>
  );
}
