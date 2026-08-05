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
  getRealPosition,
  listCreditCards,
  listRecentTransactions,
  DEFAULT_CURRENCY,
  TransactionDirection,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Balance } from "@/shared/patterns/balance";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "./money-offline-banner";
import { MoneyCaptureAction } from "./money-capture-action";
import { MoneyHubAccounts } from "./money-hub-accounts";

type Props = { params: Promise<{ locale: string }> };

export default async function MoneyHubPage({ params }: Props) {
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

  const [t, tCatalog, position, cardsListed, recent] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getRealPosition(),
    listCreditCards(),
    listRecentTransactions(8),
  ]);

  const loadFailed = position == null;
  const currency =
    position?.currency ?? cardsListed?.currency ?? DEFAULT_CURRENCY;
  const total = position?.totalBalance ?? 0;
  const liquidAccounts = position?.accounts ?? [];
  const creditCards = cardsListed?.cards ?? [];
  const activity = recent ?? [];

  const cardOutstandingTotal = creditCards.reduce(
    (sum, card) => sum + card.outstanding,
    0,
  );

  const liquidRows = liquidAccounts.map((account) => ({
    id: account.id,
    title: localizeCatalogName(tCatalog, "accounts", account.name),
    typeLabel: t(`types.${account.type}`),
    balanceLabel: formatCurrency(account.balance, currency, locale, {
      maximumFractionDigits: 0,
    }),
  }));

  const cardRows = creditCards.map((card) => ({
    id: card.accountId,
    title: localizeCatalogName(tCatalog, "accounts", card.name),
    outstandingLabel: formatCurrency(card.outstanding, currency, locale, {
      maximumFractionDigits: 0,
    }),
    availableLabel: formatCurrency(card.availableCredit, currency, locale, {
      maximumFractionDigits: 0,
    }),
    utilizationPct: card.utilizationPct,
    utilizationLabel: t("accountsPage.utilization", {
      pct: card.utilizationPct,
    }),
    dueLabel: card.nextDueDate
      ? t("accountsPage.nextDue", { date: card.nextDueDate })
      : undefined,
  }));

  return (
    <div className="flex min-h-full flex-col" data-testid="money-hub">
      <TopAppBar title={t("title")} subtitle={t("realPositionHint")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />

        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
        ) : (
          <section className="flex flex-col gap-(--space-3)">
            <Balance
              label={t("realPosition")}
              amountLabel={formatCurrency(total, currency, locale, {
                maximumFractionDigits: 0,
              })}
              size="lg"
            />
            <MoneyCaptureAction />
          </section>
        )}

        <MoneyHubAccounts
          loadFailed={loadFailed}
          liquidAccounts={liquidRows}
          creditCards={cardRows}
          liquidOptions={liquidAccounts.map((account) => ({
            id: account.id,
            name: localizeCatalogName(tCatalog, "accounts", account.name),
          }))}
          createLabel={t("createAccount")}
          createOfflineLabel={t("createAccountOffline")}
          labels={{
            sectionTitle: t("accounts"),
            liquidTitle: t("accountsPage.liquidTitle"),
            creditCardsTitle: t("accountsPage.creditCardsTitle"),
            creditCardsHint: t("accountsPage.creditCardsHint"),
            outstanding: t("accountsPage.outstanding"),
            availableCredit: t("accountsPage.availableCredit"),
            collapse: t("hubAccountsCollapse"),
            expand: t("hubAccountsExpand"),
            collapsedSummary: t("hubAccountsCollapsedSummary", {
              liquidCount: liquidAccounts.length,
              liquidTotal: formatCurrency(total, currency, locale, {
                maximumFractionDigits: 0,
              }),
              cardCount: creditCards.length,
              cardOutstanding: formatCurrency(
                cardOutstandingTotal,
                currency,
                locale,
                { maximumFractionDigits: 0 },
              ),
            }),
            emptyTitle: t("accountsPage.emptyTitle"),
            emptyDescription: t("accountsPage.emptyDescription"),
            loadErrorTitle: t("loadErrorTitle"),
            loadErrorBody: t("loadErrorBody"),
          }}
        />

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("activity")}
            action={
              <Link
                href={APP_PATH.MONEY_TRANSACTIONS}
                className="text-sm font-medium text-accent"
                data-testid="money-see-activity"
              >
                {t("seeActivity")}
              </Link>
            }
          />
          {activity.length === 0 ? (
            <EmptyState
              title={t("activityEmpty")}
              description={t("activityEmptyHint")}
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
                      subtitle={localizeCatalogName(
                        tCatalog,
                        "accounts",
                        tx.accountName,
                      )}
                      amountLabel={`${tx.type === TransactionDirection.EXPENSE ? "−" : "+"}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`}
                      tone={
                        tx.type === TransactionDirection.EXPENSE
                          ? "debit"
                          : "credit"
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-(--space-2)">
          <SectionHeader title={t("more")} />
          {(
            [
              ["debts", APP_PATH.MONEY_DEBTS, "money-link-debts"],
              ["savings", APP_PATH.MONEY_SAVINGS, "money-link-savings"],
              ["loans", APP_PATH.MONEY_LOANS, "money-link-loans"],
            ] as const
          ).map(([key, href, testId]) => (
            <Link
              key={key}
              href={href}
              className="flex min-h-11 items-center justify-between rounded-(--radius-lg) border border-border-subtle bg-surface px-(--space-4) py-(--space-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid={testId}
            >
              <Text size="sm" className="font-medium text-text-primary">
                {t(key)}
              </Text>
              <Text size="sm" tone="secondary">
                →
              </Text>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
