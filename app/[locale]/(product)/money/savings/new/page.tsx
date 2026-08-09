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
import {
  listProviders,
  listProviderPackages,
} from "@/modules/savings/application";
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

  const [t, accountsResult, providers] = await Promise.all([
    getTranslations("money.savingsWizard"),
    listAccounts(),
    listProviders(),
  ]);

  const accounts = (accountsResult?.accounts ?? []).filter(
    (a) => a.type !== AccountType.SAVINGS_PRODUCT,
  );

  const packagesByProvider: Record<
    string,
    Array<{
      id: string;
      packageName: string;
      durationDays: number;
      annualInterestRate: number;
      minAmount: number | null;
      maxAmount: number | null;
    }>
  > = {};

  for (const provider of providers ?? []) {
    const packages = await listProviderPackages(provider.id);
    packagesByProvider[provider.id] = (packages ?? []).map((p) => ({
      id: p.id,
      packageName: p.packageName,
      durationDays: p.durationDays,
      annualInterestRate: p.annualInterestRate,
      minAmount: p.minAmount,
      maxAmount: p.maxAmount,
    }));
  }

  return (
    <Page
      testId="money-savings-new"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <MoneyOfflineBanner />
      {accounts.length === 0 || !providers?.length ? (
        <EmptyState
          title={t("title")}
          description={t("reviewHint")}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <CreateSavingWizard
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
          }))}
          providers={providers.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            savingType: p.savingType,
          }))}
          packagesByProvider={packagesByProvider}
        />
      )}
    </Page>
  );
}
