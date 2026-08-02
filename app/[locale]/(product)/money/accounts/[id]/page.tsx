import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getAccount,
  listRecentTransactions,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Balance } from "@/shared/patterns/balance";
import { SectionHeader } from "@/shared/patterns/section-header";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
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

  const [t, tCatalog, result, recent] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getAccount(id),
    listRecentTransactions(12, id),
  ]);

  if (!result) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
      >
        <TopAppBar title={t("accountDetail.notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.MONEY_ACCOUNTS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("accountDetail.back")}
          </Link>
        </div>
      </div>
    );
  }

  const { account, currency } = result;
  const activity = recent ?? [];

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail"
    >
      <TopAppBar
        title={localizeCatalogName(tCatalog, "accounts", account.name)}
        subtitle={t(`types.${account.type}`)}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Balance
          label={t("accountDetail.balanceLabel")}
          amountLabel={formatCurrency(account.balance, currency, locale, {
            maximumFractionDigits: 0,
          })}
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {t("realPositionHint")}
        </Text>

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("accountDetail.recentTitle")} />
          {activity.length === 0 ? (
            <EmptyState
              title={t("accountDetail.recentEmpty")}
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col gap-(--space-2)">
              {activity.map((tx) => (
                <li key={tx.id}>
                  <Link
                    href={moneyTransactionPath(tx.id)}
                    className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <TransactionRow
                      title={
                        tx.note ||
                        localizeCatalogName(
                          tCatalog,
                          "tags",
                          tx.categoryName,
                        ) ||
                        t(`direction.${tx.type}`)
                      }
                      amountLabel={`${tx.type === "expense" ? "−" : "+"}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`}
                      tone={tx.type === "expense" ? "debit" : "credit"}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href={APP_PATH.MONEY_ACCOUNTS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("accountDetail.back")}
        </Link>
      </div>
    </div>
  );
}
