import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listSavingsEligibleAccounts,
  listProviderCatalog,
} from "@/modules/savings/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { CreateSavingWizard } from "./create-saving-wizard";
import { SavingsUnavailable } from "../savings-unavailable";

type Props = { params: Promise<{ locale: string }> };

export default async function NewSavingPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tMoney, accountsResult, catalog] = await Promise.all([
    getTranslations("money.savingsWizard"),
    getTranslations("money"),
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

  return (
    <Page
      testId="money-savings-new"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      {accounts.length === 0 ? (
        <SavingsUnavailable
          title={t("noEligibleAccounts")}
          description={t("reviewHint")}
          actionHref={APP_PATH.MONEY_ACCOUNTS}
          actionLabel={tMoney("createAccount")}
        />
      ) : (
        <CreateSavingWizard
          accounts={accounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.balance,
          }))}
          providers={providers.map((provider) => ({
            id: provider.id,
            displayName: provider.displayName,
            savingType: provider.savingType,
          }))}
          packagesByProvider={packagesByProvider}
        />
      )}
    </Page>
  );
}
