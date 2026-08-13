import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import { Link, redirect } from "@/i18n/navigation";
import {
  AccountHealthSignal,
  AccountType,
  accountHealthFromBalance,
  getAccount,
  getCreditCardDetail,
  listAccounts,
  listCreditCardInstallments,
  listEligibleCreditCardPurchases,
  listRecentTransactions,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
  TRANSACTION_LEDGER_CREDIT_TYPES,
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { FinancialAccountHero } from "@/shared/patterns/financial-account-hero";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { moneyAccountVisualFor } from "../../money-account-visuals";
import { AccountDetailManagement } from "./account-detail-management";
import { ACCOUNT_DETAIL_PREVIEW_CONFIG } from "./detail-constants";
import { CreditCardDetailActions } from "./credit-card-detail-actions";
import { CreditCardHero } from "./credit-card-hero";
import { CreditCardRefundAction } from "./credit-card-refund-action";

type AccountDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
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
    listRecentTransactions(
      ACCOUNT_DETAIL_PREVIEW_CONFIG.RECENT_ACTIVITY_LIMIT,
      id,
    ),
    listAccounts(),
  ]);

  if (!result) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
      >
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_ACCOUNTS}
          title={t("accountDetail.notFound")}
        />
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
  const isCreditCard = account.type === AccountType.CREDIT_CARD;
  const [cardDetail, installments, eligiblePurchases] = isCreditCard
    ? await Promise.all([
        getCreditCardDetail(id),
        listCreditCardInstallments(id),
        listEligibleCreditCardPurchases(id),
      ])
    : [null, [], []];
  const activity = recent ?? [];
  const liquidAccounts = (liquidListed?.accounts ?? []).map(
    (liquidAccount) => ({
      id: liquidAccount.id,
      name: localizeCatalogName(tCatalog, "accounts", liquidAccount.name),
    }),
  );
  const accountName = localizeCatalogName(tCatalog, "accounts", account.name);
  const accountTypeLabel = t(`types.${account.type}`);
  const accountManagement = (
    <AccountDetailManagement
      accountId={account.id}
      initialName={account.name}
      initialType={account.type}
    >
      {isCreditCard ? (
        <CreditCardRefundAction cardAccountId={account.id} />
      ) : null}
    </AccountDetailManagement>
  );

  if (isCreditCard && cardDetail) {
    const { card } = cardDetail;
    const outstandingLabel = formatCurrency(
      card.outstanding,
      currency,
      locale,
      {
        maximumFractionDigits: 0,
      },
    );
    const availableLabel = formatCurrency(
      card.availableCredit,
      currency,
      locale,
      {
        maximumFractionDigits: 0,
      },
    );
    const limitLabel = formatCurrency(card.creditLimit, currency, locale, {
      maximumFractionDigits: 0,
    });
    const hasCreditLimit = card.creditLimit > 0;

    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
        data-account-kind="credit-card"
      >
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_ACCOUNTS}
          title={accountName}
          subtitle={accountTypeLabel}
          trailing={accountManagement}
        />
        <div className="flex flex-1 flex-col gap-(--space-6) px-(--page-gutter) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <CreditCardHero
            title={accountName}
            outstandingLabel={outstandingLabel}
            outstandingCaption={t("accountsPage.outstanding")}
            utilizationPct={hasCreditLimit ? card.utilizationPct : null}
            utilizationLabel={
              hasCreditLimit
                ? t("accountsPage.utilization", { pct: card.utilizationPct })
                : t("hub.utilizationUnavailable")
            }
            utilizationAriaLabel={
              hasCreditLimit
                ? t("hub.utilizationAria", { pct: card.utilizationPct })
                : undefined
            }
            availableLabel={availableLabel}
            availableCaption={t("accountsPage.availableCredit")}
            limitLabel={limitLabel}
            limitCaption={t("hub.creditLimit")}
            dueLabel={
              card.nextDueDate
                ? t("accountsPage.nextDue", { date: card.nextDueDate })
                : undefined
            }
          />
          <CreditCardDetailActions
            card={card}
            liquidAccounts={liquidAccounts}
            currency={currency}
            installments={installments ?? []}
            eligiblePurchases={eligiblePurchases ?? []}
          />
        </div>
      </div>
    );
  }

  const accountVisual = moneyAccountVisualFor(account.type);
  const health = accountHealthFromBalance(account.balance);
  const balanceLabel = formatCurrency(account.balance, currency, locale, {
    maximumFractionDigits: 0,
  });

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail"
    >
      <TopAppBar
        variant="detail"
        backHref={APP_PATH.MONEY_ACCOUNTS}
        title={accountName}
        subtitle={accountTypeLabel}
        trailing={accountManagement}
      />
      <div className="flex flex-1 flex-col gap-(--space-6) px-(--page-gutter) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <FinancialAccountHero
          icon={accountVisual.icon}
          iconTone={accountVisual.tone}
          eyebrow={accountTypeLabel}
          title={accountName}
          amountLabel={balanceLabel}
          amountCaption={t("accountDetail.balanceLabel")}
          supporting={
            health === AccountHealthSignal.ZERO ? (
              <Text
                size="sm"
                tone="secondary"
                data-testid="account-health-zero"
              >
                {t("accountDetail.healthZero")}
              </Text>
            ) : undefined
          }
        />
        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader title={t("accountDetail.quickActions")} />
          <Link
            href={APP_PATH.MONEY_ADD}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-medium text-accent-fg shadow-[var(--elevation-1)] transition-[transform,background-color] duration-[var(--duration-fast)] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
            data-testid="account-quick-capture"
          >
            {t("accountDetail.capture")}
          </Link>
        </section>
        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("accountDetail.recentTitle")}
            action={
              <Link
                href={APP_PATH.MONEY_TRANSACTIONS}
                data-testid="account-quick-activity"
              >
                {t("accountDetail.viewActivity")}
              </Link>
            }
          />
          {activity.length === 0 ? (
            <EmptyState
              title={t("accountDetail.recentEmpty")}
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col gap-(--space-2)">
              {activity.map((transaction) => {
                const isCredit = (
                  TRANSACTION_LEDGER_CREDIT_TYPES as readonly string[]
                ).includes(transaction.type);
                const transactionTone = isCredit
                  ? TransactionAmountTone.CREDIT
                  : TransactionAmountTone.DEBIT;
                const transactionIcon = isCredit
                  ? FINANCE_ICONS.income
                  : FINANCE_ICONS.expense;
                const transactionIconTone = isCredit ? "income" : "expense";

                return (
                  <li key={transaction.id}>
                    <Link
                      href={moneyTransactionPath(transaction.id)}
                      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      <TransactionRow
                        leading={
                          <IconContainer tone={transactionIconTone} size="sm">
                            <AppIcon icon={transactionIcon} size="sm" />
                          </IconContainer>
                        }
                        title={
                          transaction.note ||
                          localizeCatalogName(
                            tCatalog,
                            "tags",
                            transaction.categoryName,
                          ) ||
                          t(`direction.${transaction.type}`)
                        }
                        subtitle={`${t(`direction.${transaction.type}`)} · ${transaction.transactionDate}`}
                        amountLabel={`${TRANSACTION_LEDGER_AMOUNT_PREFIX[transaction.type]}${formatCurrency(
                          transaction.amount,
                          transaction.currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        )}`}
                        tone={transactionTone}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
