import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listProviderCatalog } from "@/modules/savings/application/savings-provider-registry";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SavingsCatalogManager } from "../savings-catalog-manager";

type Props = { params: Promise<{ locale: string }> };

export default async function SavingsProvidersPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }
  const [t, catalog] = await Promise.all([
    getTranslations("money.savingsCatalog"),
    listProviderCatalog(),
  ]);
  return (
    <Page
      testId="money-savings-providers"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      {catalog == null ? (
        <EmptyState title={t("title")} description={t("saveError")} />
      ) : (
        <SavingsCatalogManager catalog={catalog} />
      )}
    </Page>
  );
}
