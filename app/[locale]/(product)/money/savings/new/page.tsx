import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import {
  listSavingsEligibleAccounts,
  listProviderCatalog,
} from "@/modules/savings/application";
import { CreateSavingTopAppBar } from "./create-saving-navigation";
import { Page } from "@/shared/patterns/page";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { CreateSavingWizard } from "./create-saving-wizard";

type Props = { params: Promise<{ locale: string }> };

export default async function NewSavingPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const { user, membership } = await getSessionMembership();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  // Start both server reads once; the independent Setup controls can stream first.
  const data = loadCreateSavingData();
  const [t, tMoney] = await Promise.all([
    getTranslations("money.savingsWizard"),
    getTranslations("money"),
  ]);

  return (
    <Page
      testId="money-savings-new"
      topBar={
        <CreateSavingTopAppBar title={t("title")} subtitle={t("subtitle")} />
      }
    >
      <MoneyOfflineBanner />
      <CreateSavingWizard
        data={data}
        unavailable={{
          title: t("noEligibleAccounts"),
          description: t("reviewHint"),
          actionHref: APP_PATH.MONEY_ACCOUNTS,
          actionLabel: tMoney("createAccount"),
        }}
      />
    </Page>
  );
}

async function loadCreateSavingData() {
  const [accountsResult, catalog] = await Promise.all([
    listSavingsEligibleAccounts(),
    listProviderCatalog(),
  ]);
  const accounts = accountsResult?.accounts ?? [];
  const providers = catalog ?? [];
  const packagesByProvider = Object.fromEntries(
    providers.map((provider) => [
      provider.id,
      provider.packages.map((pkg) => ({
        id: pkg.id,
        packageName: pkg.packageName,
        durationDays: pkg.durationDays,
        annualInterestRate: pkg.annualInterestRate,
        minAmount: pkg.minAmount,
        maxAmount: pkg.maxAmount,
        renewableAvailable: pkg.renewableAvailable,
        termAmount: pkg.termAmount,
        termUnit: pkg.termUnit,
        interestCalculationMethod: pkg.interestCalculationMethod,
        taxRule: pkg.taxRule,
        taxRatePercent: pkg.taxRatePercent,
        earlySettlementRule: pkg.earlySettlementRule,
        earlySettlementRatePercent: pkg.earlySettlementRatePercent,
        supportsPartialSettlement: pkg.supportsPartialSettlement,
      })),
    ]),
  );

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
    })),
    providers: providers.map((provider) => ({
      id: provider.id,
      displayName: provider.displayName,
      savingType: provider.savingType,
    })),
    packagesByProvider,
  };
}
