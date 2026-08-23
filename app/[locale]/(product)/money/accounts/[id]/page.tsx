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
  moneyAccountPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
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
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { moneyAccountVisualFor } from "../../money-account-visuals";
import { AccountDetailManagement } from "./account-detail-management";
import { AccountQuickCapture } from "./account-quick-capture";
import { ACCOUNT_DETAIL_PREVIEW_CONFIG } from "./detail-constants";
import { CreditCardDetailActions } from "./credit-card-detail-actions";
import { CreditCardHero } from "./credit-card-hero";
import { CreditCardRefundAction } from "./credit-card-refund-action";
import { resolveAccountIdentity } from "./account-detail-presentations";

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
          backHref={APP_PATH.MONEY}
          title={t("accountDetail.unavailableTitle")}
        />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--page-gutter) pb-(--space-6) pt-(--space-4)">
          <StatusAlert
            variant="danger"
            title={t("accountDetail.unavailableTitle")}
            description={t("accountDetail.unavailableBody")}
          />
          <Link
            href={APP_PATH.MONEY}
            className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
  const activityLoadFailed = recent == null;
  const activity = recent ?? [];
  const liquidAccounts = (liquidListed?.accounts ?? []).map(
    (liquidAccount) => ({
      id: liquidAccount.id,
      name: localizeCatalogName(tCatalog, "accounts", liquidAccount.name),
    }),
  );
  const accountName = localizeCatalogName(tCatalog, "accounts", account.name);
  const accountTypeLabel = t(`types.${account.type}`);
  const accountIdentity = resolveAccountIdentity(accountName, accountTypeLabel);
  const accountManagement = (
    <AccountDetailManagement
      accountId={account.id}
      initialName={account.name}
      initialType={account.type}
      canMutate={account.canMutate}
    >
      {isCreditCard ? (
        <CreditCardRefundAction cardAccountId={account.id} />
      ) : null}
    </AccountDetailManagement>
  );

  if (isCreditCard && !cardDetail) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
        data-account-kind="credit-card"
      >
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          title={accountName}
          subtitle={accountTypeLabel}
          trailing={account.canMutate ? accountManagement : undefined}
        />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--page-gutter) pb-(--space-6) pt-(--space-4)">
          <StatusAlert
            variant="danger"
            title={t("accountDetail.unavailableTitle")}
            description={t("accountDetail.unavailableBody")}
          />
          <Link
            href={moneyAccountPath(account.id)}
            className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("hub.retry")}
          </Link>
        </div>
      </div>
    );
  }

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
          backHref={APP_PATH.MONEY}
          title={accountName}
          subtitle={accountTypeLabel}
          trailing={account.canMutate ? accountManagement : undefined}
        />
        <div className="flex flex-1 flex-col gap-(--space-6) px-(--page-gutter) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <CreditCardHero
            outstandingLabel={outstandingLabel}
            outstandingCaption={t("creditCard.currentOutstandingLabel")}
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
            availableCaption={t("creditCard.availableCreditLabel")}
            limitLabel={limitLabel}
            limitCaption={t("creditCard.creditLimitLabel")}
            dueLabel={
              card.nextDueDate
                ? t("creditCard.due.dueDate", { date: card.nextDueDate })
                : undefined
            }
            context={
              <FinancialOwnershipBadge
                financialScope={account.financialScope}
                isOwnedByMe={account.isOwnedByMe}
                ownerStatus={account.ownerStatus}
                onHero
                showExplanation
              />
            }
          />
          {account.canMutate ? (
            <CreditCardDetailActions
              card={card}
              liquidAccounts={liquidAccounts}
              currency={currency}
              installments={installments ?? []}
              eligiblePurchases={eligiblePurchases ?? []}
            />
          ) : null}
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
        backHref={APP_PATH.MONEY}
        title={accountName}
        subtitle={accountIdentity.typeLabel ?? undefined}
        trailing={account.canMutate ? accountManagement : undefined}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--page-gutter) pb-(--space-6) pt-(--space-3)">
        <MoneyOfflineBanner />
        <MotionReveal>
          <FinancialAccountHero
            icon={accountVisual.icon}
            amountCaption={t("accountDetail.balanceLabel")}
            amountLabel={balanceLabel}
            context={
              <>
                <FinancialOwnershipBadge
                  financialScope={account.financialScope}
                  isOwnedByMe={account.isOwnedByMe}
                  ownerStatus={account.ownerStatus}
                  onHero
                  showExplanation
                />
                {health === AccountHealthSignal.ZERO ? (
                  <Text
                    size="sm"
                    className="text-hero-muted"
                    data-testid="account-health-zero"
                  >
                    {t("accountDetail.healthZero")}
                  </Text>
                ) : null}
              </>
            }
          />
        </MotionReveal>
        {account.canMutate ? <AccountQuickCapture /> : null}
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
          {activityLoadFailed ? (
            <div className="flex flex-col gap-(--space-2)">
              <StatusAlert
                variant="danger"
                title={t("accountDetail.recentLoadErrorTitle")}
                description={t("accountDetail.recentLoadErrorBody")}
              />
              <Link
                href={moneyAccountPath(account.id)}
                className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("hub.retry")}
              </Link>
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              title={t("accountDetail.recentEmpty")}
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col">
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
