import { getTranslations } from "next-intl/server";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import { getHouseholdBaseCurrency } from "@/modules/tenancy/application/get-household-base-currency";
import {
  AccountType,
  DEFAULT_CURRENCY,
  listAccounts,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { Page } from "@/shared/patterns/page";
import { AddAccountForm } from "./add-account-form";
import { AccountsReturnTopAppBar } from "./accounts-return-navigation";
import { MoneyOfflineBanner } from "../money-offline-banner";

type Props = {
  locale: string;
  fixedType?: AccountTypeValue;
};

export async function AccountCreatePage({
  locale: rawLocale,
  fixedType,
}: Props) {
  const { membership } = await requireProductSession({
    localeParam: rawLocale,
  });

  const isCreditCard = fixedType === AccountType.CREDIT_CARD;
  const accountDataPromise = isCreditCard
    ? Promise.all([listAccounts(), getTranslations("catalog")]).then(
        ([accounts, tCatalog]) => ({
          currency: accounts?.currency ?? DEFAULT_CURRENCY,
          liquidAccounts: (accounts?.accounts ?? []).map((account) => ({
            id: account.id,
            name: localizeCatalogName(tCatalog, "accounts", account.name),
          })),
        }),
      )
    : undefined;
  const currencyPromise = accountDataPromise
    ? accountDataPromise.then(({ currency }) => currency)
    : getHouseholdBaseCurrency(membership.householdId);
  const t = await getTranslations("money");
  const title = isCreditCard
    ? t("accountsPage.addCreditCard")
    : t("accountsPage.add");

  return (
    <Page
      testId="account-create-page"
      contentClassName="gap-(--space-4)"
      topBar={
        <AccountsReturnTopAppBar
          variant="form"
          backLabel={t("accountsPage.title")}
          title={title}
          subtitle={isCreditCard ? undefined : t("accountsPage.addDescription")}
        />
      }
    >
      <MoneyOfflineBanner />
      <AddAccountForm
        liquidAccounts={[]}
        currency={DEFAULT_CURRENCY}
        currencyPromise={currencyPromise}
        accountDataPromise={accountDataPromise}
        hideDefaultTrigger
        presentation="page"
        fixedType={fixedType}
        hideCreditCardType={!isCreditCard}
      />
    </Page>
  );
}
