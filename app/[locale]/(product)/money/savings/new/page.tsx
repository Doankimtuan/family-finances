import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listAccounts } from "@/modules/ledger/application";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import { listProviderCatalog } from "@/modules/savings/application/savings-provider-registry";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { EmptyState } from "@/shared/patterns/empty-state";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { CreateSavingWizard } from "./create-saving-wizard";

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

  const [t, accountsResult, catalog] = await Promise.all([
    getTranslations("money.savingsWizard"),
    listAccounts(),
    listProviderCatalog(),
  ]);

  const accounts = (accountsResult?.accounts ?? []).filter(
    (account) => account.type !== AccountType.SAVINGS_PRODUCT,
  );
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
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <MoneyOfflineBanner />
      {accounts.length === 0 || providers.length === 0 ? (
        <EmptyState
          title={t("title")}
          description={t("reviewHint")}
          className="flex-none py-(--space-4)"
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
