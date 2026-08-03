import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listAccounts, DEFAULT_CURRENCY } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Balance } from "@/shared/patterns/balance";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { AddAccountForm } from "./add-account-form";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tCatalog, listed] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    listAccounts(),
  ]);

  const currency = listed?.currency ?? DEFAULT_CURRENCY;
  const accounts = listed?.accounts ?? [];
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex min-h-full flex-col" data-testid="money-accounts">
      <TopAppBar
        title={t("accountsPage.title")}
        subtitle={t("accountsPage.subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Balance
          label={t("realPosition")}
          amountLabel={formatCurrency(total, currency, locale, {
            maximumFractionDigits: 0,
          })}
        />

        {accounts.length === 0 ? (
          <EmptyState
            title={t("accountsPage.emptyTitle")}
            description={t("accountsPage.emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {accounts.map((account) => (
              <li key={account.id}>
                <Link href={moneyAccountPath(account.id)} className="block">
                  <Card className="gap-0 p-(--space-4)">
                    <div className="flex items-center justify-between gap-(--space-3)">
                      <div className="min-w-0">
                        <Text
                          size="sm"
                          className="truncate font-medium text-text-primary"
                        >
                          {localizeCatalogName(
                            tCatalog,
                            "accounts",
                            account.name,
                          )}
                        </Text>
                        <Text size="sm" tone="secondary">
                          {t(`types.${account.type}`)}
                        </Text>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                        {formatCurrency(account.balance, currency, locale, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <AddAccountForm />

        <Link
          href={APP_PATH.MONEY}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("backToMoney")}
        </Link>
      </div>
    </div>
  );
}
