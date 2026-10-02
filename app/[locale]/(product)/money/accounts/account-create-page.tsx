import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  AccountType,
  DEFAULT_CURRENCY,
  listAccounts,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AddAccountForm } from "./add-account-form";
import { MoneyOfflineBanner } from "../money-offline-banner";

type Props = {
  locale: string;
  fixedType?: AccountTypeValue;
};

export async function AccountCreatePage({
  locale: rawLocale,
  fixedType,
}: Props) {
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tCatalog, accounts] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    listAccounts(),
  ]);
  const isCreditCard = fixedType === AccountType.CREDIT_CARD;
  const title = isCreditCard
    ? t("accountsPage.addCreditCard")
    : t("accountsPage.add");

  return (
    <Page
      testId="account-create-page"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="form"
          backHref={APP_PATH.MONEY_ACCOUNTS}
          backLabel={t("accountsPage.title")}
          title={title}
          subtitle={isCreditCard ? undefined : t("accountsPage.addDescription")}
        />
      }
    >
      <MoneyOfflineBanner />
      <AddAccountForm
        liquidAccounts={(accounts?.accounts ?? []).map((account) => ({
          id: account.id,
          name: localizeCatalogName(tCatalog, "accounts", account.name),
        }))}
        currency={accounts?.currency ?? DEFAULT_CURRENCY}
        hideDefaultTrigger
        presentation="page"
        fixedType={fixedType}
        hideCreditCardType={!isCreditCard}
      />
    </Page>
  );
}
