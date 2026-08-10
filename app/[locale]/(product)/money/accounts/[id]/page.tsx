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
  getCreditCardDetail,
  listAccounts,
  listRecentTransactions,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
  TRANSACTION_LEDGER_CREDIT_TYPES,
  accountHealthFromBalance,
  AccountHealthSignal,
  AccountType,
} from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Balance } from "@/shared/patterns/balance";
import { CreditCardCard } from "@/shared/patterns/credit-card-card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { AccountDetailActions } from "./account-detail-actions";
import { CreditCardDetailActions } from "./credit-card-detail-actions";

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

  const [t, tCatalog, result, recent, liquidListed] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    getAccount(id),
    listRecentTransactions(12, id),
    listAccounts(),
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
            href={APP_PATH.MONEY}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("backToMoney")}
          </Link>
        </div>
      </div>
    );
  }

  const { account, currency } = result;
  const isCard = account.type === AccountType.CREDIT_CARD;
  const cardDetail = isCard ? await getCreditCardDetail(id) : null;
  const activity = recent ?? [];
  const health = accountHealthFromBalance(account.balance);
  const liquidAccounts = (liquidListed?.accounts ?? []).map((a) => ({
    id: a.id,
    name: localizeCatalogName(tCatalog, "accounts", a.name),
  }));

  if (isCard && cardDetail) {
    const { card } = cardDetail;
    const outstandingLabel = formatCurrency(
      card.outstanding,
      currency,
      locale,
      { maximumFractionDigits: 0 },
    );
    const availableLabel = formatCurrency(
      card.availableCredit,
      currency,
      locale,
      { maximumFractionDigits: 0 },
    );

    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
        data-account-kind="credit-card"
      >
        <TopAppBar
          title={localizeCatalogName(tCatalog, "accounts", account.name)}
          subtitle={t(`types.${account.type}`)}
        />
        <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <CreditCardCard
            title={localizeCatalogName(tCatalog, "accounts", card.name)}
            outstandingCaption={t("accountsPage.outstanding")}
            outstandingLabel={outstandingLabel}
            availableCaption={t("accountsPage.availableCredit")}
            availableLabel={availableLabel}
            utilizationPct={card.utilizationPct}
            utilizationLabel={t("accountsPage.utilization", {
              pct: card.utilizationPct,
            })}
            dueLabel={
              card.nextDueDate
                ? t("accountsPage.nextDue", { date: card.nextDueDate })
                : undefined
            }
          />
          <Text size="sm" tone="secondary">
            {t("creditCard.notBankBalance")}
          </Text>

          <CreditCardDetailActions
            card={card}
            liquidAccounts={liquidAccounts}
            outstandingLabel={outstandingLabel}
            availableLabel={availableLabel}
            currency={currency}
          />

          <AccountDetailActions
            accountId={account.id}
            initialName={account.name}
            initialType={account.type}
          />

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
        <section className="flex flex-col gap-(--space-2)">
          <Balance
            label={t("accountDetail.balanceLabel")}
            amountLabel={formatCurrency(account.balance, currency, locale, {
              maximumFractionDigits: 0,
            })}
            size="lg"
          />
          <Text size="sm" tone="secondary">
            {t("accountDetail.ownershipHint")}
          </Text>
          {health === AccountHealthSignal.ZERO ? (
            <Text size="sm" tone="secondary" data-testid="account-health-zero">
              {t("accountDetail.healthZero")}
            </Text>
          ) : null}
        </section>

        <section className="flex flex-col gap-(--space-2)">
          <SectionHeader title={t("accountDetail.quickActions")} />
          <Link
            href={APP_PATH.MONEY_ADD}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="account-quick-capture"
          >
            {t("accountDetail.capture")}
          </Link>
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="account-quick-activity"
          >
            {t("accountDetail.viewActivity")}
          </Link>
          <AccountDetailActions
            accountId={account.id}
            initialName={account.name}
            initialType={account.type}
          />
        </section>

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
                      amountLabel={`${TRANSACTION_LEDGER_AMOUNT_PREFIX[tx.type]}${formatCurrency(tx.amount, tx.currency, locale, { maximumFractionDigits: 0 })}`}
                      tone={
                        (TRANSACTION_LEDGER_CREDIT_TYPES as readonly string[]).includes(tx.type)
                          ? "credit"
                          : "debit"
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
