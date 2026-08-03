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
import {
  listAccounts,
  DEFAULT_CURRENCY,
  accountHealthFromBalance,
  AccountHealthSignal,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AccountCard } from "@/shared/patterns/account-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Balance } from "@/shared/patterns/balance";
import { SectionHeader } from "@/shared/patterns/section-header";
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
        <section className="flex flex-col gap-(--space-2)">
          <Balance
            label={t("realPosition")}
            amountLabel={formatCurrency(total, currency, locale, {
              maximumFractionDigits: 0,
            })}
          />
          <Text size="sm" tone="secondary">
            {t("accountsPage.ownershipHint")}
          </Text>
        </section>

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("accountsPage.liquidTitle")} />
          {accounts.length === 0 ? (
            <EmptyState
              title={t("accountsPage.emptyTitle")}
              description={t("accountsPage.emptyDescription")}
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col gap-(--space-2)">
              {accounts.map((account) => {
                const health = accountHealthFromBalance(account.balance);
                return (
                  <li key={account.id}>
                    <Link
                      href={moneyAccountPath(account.id)}
                      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <AccountCard
                        title={localizeCatalogName(
                          tCatalog,
                          "accounts",
                          account.name,
                        )}
                        typeLabel={t(`types.${account.type}`)}
                        balanceLabel={formatCurrency(
                          account.balance,
                          currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        )}
                        healthSignal={health}
                        healthLabel={
                          health === AccountHealthSignal.ZERO
                            ? t("accountsPage.healthZero")
                            : undefined
                        }
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <AddAccountForm />

        <section className="flex flex-col gap-(--space-2)">
          <SectionHeader title={t("accountsPage.plansTitle")} />
          <Text size="sm" tone="secondary">
            {t("accountsPage.plansHint")}
          </Text>
          {(
            [
              ["plansDebts", APP_PATH.MONEY_DEBTS, "accounts-link-debts"],
              ["plansSavings", APP_PATH.MONEY_SAVINGS, "accounts-link-savings"],
              ["plansCards", APP_PATH.MONEY_CARDS, "accounts-link-cards"],
            ] as const
          ).map(([key, href, testId]) => (
            <Link
              key={key}
              href={href}
              className="flex min-h-11 items-center justify-between rounded-(--radius-lg) border border-border-subtle bg-surface px-(--space-4) py-(--space-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid={testId}
            >
              <Text size="sm" className="font-medium text-text-primary">
                {t(`accountsPage.${key}`)}
              </Text>
              <Text size="sm" tone="secondary">
                →
              </Text>
            </Link>
          ))}
        </section>

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
