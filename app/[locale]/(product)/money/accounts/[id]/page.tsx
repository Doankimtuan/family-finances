import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  AccountHealthSignal,
  AccountType,
  CardBillingMonthStatus,
  accountHealthFromBalance,
  getAccount,
  getAccountType,
  getCreditCardDetail,
  listAccounts,
  listCreditCardBillingItems,
  listCreditCardInstallments,
  listEligibleCreditCardPurchases,
  listRecentTransactions,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyAccountPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
import { Card } from "@/shared/patterns/card";
import { Balance } from "@/shared/patterns/balance";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { AccountsReturnTopAppBar } from "../accounts-return-navigation";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import {
  SkeletonAmount,
  SkeletonIcon,
  SkeletonText,
} from "@/shared/ui/skeleton";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InlineAlert, InlineAlertVariant } from "@/shared/ui/inline-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { moneyAccountVisualFor } from "../../money-account-visuals";
import { AccountDetailManagement } from "./account-detail-management";
import { AccountDetailQuickActions } from "./account-detail-quick-actions";
import { AccountDetailPrivacyToggle } from "./account-detail-privacy-toggle";
import { AccountDetailUnavailable } from "./account-detail-unavailable";
import { AccountSectionTitle } from "./account-section-title";
import { AccountViewActivityAction } from "./account-view-activity-action";
import {
  ACCOUNT_ACTIVITY_LIST_CLASS,
  ACCOUNT_DETAIL_PREVIEW_CONFIG,
} from "./detail-constants";
import {
  CreditCardChargeAction,
  CreditCardDetailActions,
} from "./credit-card-detail-actions";
import { CreditCardHero } from "./credit-card-hero";
import { CreditCardActivitySection } from "./credit-card-activity-section";
import { CreditCardDueLead } from "./credit-card-due-lead";
import { CreditCardInstallmentsSection } from "./credit-card-installments-section";
import { isCreditFacilityComplete } from "@/modules/ledger/ui/credit-facility-presentation";
import { CreditCardRefundAction } from "./credit-card-refund-action";
import { resolveAccountActivityLeading } from "./account-detail-presentations";

type AccountDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { locale: rawLocale, id } = await params;
  const { locale } = await requireProductSession({ localeParam: rawLocale });

  const resultPromise = getAccount(id);
  const accountTypePromise = getAccountType(id);
  const cardDetailPromise = accountTypePromise.then((accountType) =>
    accountType === AccountType.CREDIT_CARD
      ? getCreditCardDetail(id, resultPromise)
      : null,
  );
  const recentPromise = accountTypePromise.then((accountType) =>
    !accountType || accountType === AccountType.CREDIT_CARD
      ? null
      : listRecentTransactions(
          ACCOUNT_DETAIL_PREVIEW_CONFIG.RECENT_ACTIVITY_LIMIT,
          id,
        ),
  );
  const [t, tCatalog, accountType] = await Promise.all([
    getTranslations("money"),
    getTranslations("catalog"),
    accountTypePromise,
  ]);

  const unavailableAccount = () => (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail"
    >
      <AccountsReturnTopAppBar
        variant="detail"
        backLabel={t("accountsPage.title")}
        title={t("accountDetail.unavailableTitle")}
      />
      <AccountDetailUnavailable
        title={t("accountDetail.unavailableTitle")}
        description={t("accountDetail.unavailableBody")}
        actionHref={APP_PATH.MONEY_ACCOUNTS}
        actionLabel={t("accountsPage.title")}
      />
    </div>
  );

  if (!accountType) {
    return unavailableAccount();
  }

  const result = await resultPromise;
  if (!result) {
    return unavailableAccount();
  }

  const { account, currency } = result;
  const isCreditCard = account.type === AccountType.CREDIT_CARD;
  const accountName = localizeCatalogName(tCatalog, "accounts", account.name);
  const accountTypeLabel = t(`types.${account.type}`);
  const accountManagement = (
    <AccountDetailManagement
      accountId={account.id}
      initialName={account.name}
      initialType={account.type}
      initialIconKey={account.iconKey}
      canMutate={account.canMutate}
      settingsTrigger
    >
      {isCreditCard ? (
        <CreditCardRefundAction cardAccountId={account.id} />
      ) : null}
    </AccountDetailManagement>
  );

  if (isCreditCard) {
    const billingItemsPromise = listCreditCardBillingItems(account.id);
    const installmentsPromise = listCreditCardInstallments(account.id);
    const eligiblePurchasesPromise = listEligibleCreditCardPurchases(
      account.id,
    );
    const liquidAccountsPromise = listAccounts().then((liquidListed) =>
      liquidListed
        ? liquidListed.accounts.map((liquidAccount) => ({
            id: liquidAccount.id,
            name: localizeCatalogName(tCatalog, "accounts", liquidAccount.name),
          }))
        : null,
    );
    const cardDetail = await cardDetailPromise;

    if (!cardDetail) {
      return (
        <div
          className="flex min-h-full flex-col"
          data-testid="money-account-detail"
          data-account-kind="credit-card"
        >
          <AccountsReturnTopAppBar
            variant="detail"
            backLabel={t("accountsPage.title")}
            title={t("creditCard.detailTitle")}
            trailing={account.canMutate ? accountManagement : undefined}
          />
          <AccountDetailUnavailable
            title={t("accountDetail.unavailableTitle")}
            description={t("accountDetail.unavailableBody")}
            actionHref={moneyAccountPath(account.id)}
            actionLabel={t("hub.retry")}
            icon={
              <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.DISPLAY} />
            }
          />
        </div>
      );
    }

    const { card } = cardDetail;
    const linkedPaymentAccountLabelPromise = liquidAccountsPromise.then(
      (liquidAccounts) =>
        liquidAccounts === null
          ? t("creditCard.paymentAccountsLoadError")
          : (liquidAccounts.find(
              (liquidAccount) => liquidAccount.id === card.linkedBankAccountId,
            )?.name ?? t("creditCard.unlinkedPaymentAccount")),
    );
    const openMonths = [...card.months]
      .filter((month) => month.status !== CardBillingMonthStatus.SETTLED)
      .sort((left, right) =>
        left.billingMonth.localeCompare(right.billingMonth),
      );
    const leadMonth = openMonths[0] ?? null;
    const remainingDue = leadMonth?.remaining ?? card.outstanding;
    const outstandingLabel = formatCurrency(
      card.outstanding,
      currency,
      locale,
      {
        maximumFractionDigits: 0,
      },
    );
    const creditFacilityComplete = isCreditFacilityComplete(card.creditLimit);
    const unavailableLabel = t("creditCard.valueUnavailable");
    const availableLabel = creditFacilityComplete
      ? formatCurrency(card.availableCredit, currency, locale, {
          maximumFractionDigits: 0,
        })
      : unavailableLabel;
    const limitLabel = creditFacilityComplete
      ? formatCurrency(card.creditLimit, currency, locale, {
          maximumFractionDigits: 0,
        })
      : unavailableLabel;

    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-account-detail"
        data-account-kind="credit-card"
      >
        <AccountsReturnTopAppBar
          variant="detail"
          backLabel={t("accountsPage.title")}
          title={t("creditCard.detailTitle")}
          trailing={account.canMutate ? accountManagement : undefined}
        />
        <div className="flex flex-1 flex-col gap-(--space-3) px-(--page-gutter) pb-(--space-6) pt-(--space-3)">
          <MoneyOfflineBanner />
          <CreditCardHero
            title={accountName}
            typeLabel={accountTypeLabel}
            outstandingLabel={outstandingLabel}
            outstandingCaption={t("creditCard.currentOutstandingLabel")}
            debtWarning={t("creditCard.debtWarning")}
            outstandingAriaLabel={t("creditCard.owedAriaLabel")}
            utilizationPct={creditFacilityComplete ? card.utilizationPct : null}
            utilizationLabel={
              creditFacilityComplete
                ? t("accountsPage.utilization", { pct: card.utilizationPct })
                : t("hub.utilizationUnavailable")
            }
            utilizationAriaLabel={
              creditFacilityComplete
                ? t("hub.utilizationAria", { pct: card.utilizationPct })
                : undefined
            }
            availableLabel={availableLabel}
            availableCaption={t("creditCard.availableCreditLabel")}
            limitLabel={limitLabel}
            limitCaption={t("creditCard.creditLimitLabel")}
            creditFacilityComplete={creditFacilityComplete}
            trailing={<AccountDetailPrivacyToggle />}
            context={
              <FinancialOwnershipBadge
                financialScope={account.financialScope}
                isOwnedByMe={account.isOwnedByMe}
                ownerStatus={account.ownerStatus}
                compact
              />
            }
          />
          {leadMonth ? (
            <CreditCardDueLead
              leadMonth={leadMonth}
              remainingDueLabel={formatCurrency(
                remainingDue,
                currency,
                locale,
                { maximumFractionDigits: 0 },
              )}
              statementLabel={formatCurrency(
                leadMonth.statementAmount,
                currency,
                locale,
                { maximumFractionDigits: 0 },
              )}
              paidLabel={formatCurrency(
                leadMonth.paidAmount,
                currency,
                locale,
                {
                  maximumFractionDigits: 0,
                },
              )}
              linkedPaymentAccount={
                <Suspense
                  fallback={
                    <SkeletonText
                      width="60%"
                      className="min-h-3.5"
                      role="status"
                      aria-label={t("creditCard.loadingPaymentActions")}
                    />
                  }
                >
                  <CreditCardLinkedPaymentAccountName
                    labelPromise={linkedPaymentAccountLabelPromise}
                  />
                </Suspense>
              }
            />
          ) : (
            <EmptyState
              title={t("creditCard.noCurrentStatement")}
              icon={
                <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.DISPLAY} />
              }
              className="flex-none py-(--space-4)"
            />
          )}
          <div
            className="grid grid-cols-3 gap-(--space-2)"
            role="group"
            aria-label={t("creditCard.quickActions")}
            data-testid="credit-card-quick-actions"
          >
            <Suspense
              fallback={
                <CreditCardQuickActionFallback
                  label={t("creditCard.loadingPaymentActions")}
                  testId="card-payment-actions-fallback"
                />
              }
            >
              <CreditCardDetailActions
                card={card}
                liquidAccountsPromise={liquidAccountsPromise}
                currency={currency}
                remainingDue={remainingDue}
                canMutate={account.canMutate}
              />
            </Suspense>
            <CreditCardChargeAction
              cardAccountId={account.id}
              canMutate={account.canMutate}
            />
            <Suspense
              fallback={
                <CreditCardQuickActionFallback
                  label={t("creditCard.loadingInstallmentActions")}
                  testId="card-installment-actions-fallback"
                />
              }
            >
              <CreditCardInstallmentsSection
                cardAccountId={account.id}
                installmentsPromise={installmentsPromise}
                eligiblePurchasesPromise={eligiblePurchasesPromise}
                currency={currency}
                canMutate={account.canMutate}
                presentation="quick-action"
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <CreditCardActivityFallback
                title={t("creditCard.activityTitle")}
                label={t("creditCard.loadingActivity")}
              />
            }
          >
            <CreditCardBillingActivityStream
              accountId={account.id}
              currency={currency}
              itemsPromise={billingItemsPromise}
            />
          </Suspense>
          <InlineAlert
            variant={InlineAlertVariant.INFO}
            description={t("creditCard.ledgerReminder")}
          />
          <AccountDetailManagement
            accountId={account.id}
            initialName={account.name}
            initialType={account.type}
            initialIconKey={account.iconKey}
            canMutate={account.canMutate}
            presentation="settings"
            settingsHeading={t("creditCard.settingsTitle")}
            settingsDetail={{
              title: t("creditCard.billingCycleLabel"),
              description: t("creditCard.billingCycleDays", {
                statementDay: card.statementDay,
                dueDay: card.dueDay,
              }),
            }}
            financialScope={account.financialScope}
            isOwnedByMe={account.isOwnedByMe}
            ownerStatus={account.ownerStatus}
          />
        </div>
      </div>
    );
  }

  const accountVisual = moneyAccountVisualFor(account.type, account.iconKey);
  const health = accountHealthFromBalance(account.balance);
  const balanceLabel = formatCurrency(account.balance, currency, locale, {
    maximumFractionDigits: 0,
  });
  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail"
    >
      <AccountsReturnTopAppBar
        variant="detail"
        backLabel={t("accountsPage.title")}
        title={t("accountDetail.title")}
        trailing={account.canMutate ? accountManagement : undefined}
      />
      <div className="flex flex-1 flex-col gap-(--space-3) px-(--page-gutter) pb-(--space-6) pt-(--space-3)">
        <MoneyOfflineBanner />
        <MotionReveal>
          <Card
            tone="elevated"
            className="gap-0 p-(--space-3)"
            data-testid="account-detail-hero"
          >
            <div className="flex items-center gap-(--space-3)">
              <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
                <IconContainer tone={accountVisual.tone} size="md">
                  <AppIcon icon={accountVisual.icon} size={AppIconSize.MD} />
                </IconContainer>
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                  <Text size="sm" weight="semibold" className="truncate">
                    {accountName}
                  </Text>
                  <Text size="xs" tone="secondary" className="truncate">
                    {accountTypeLabel}
                  </Text>
                </div>
                <FinancialOwnershipBadge
                  financialScope={account.financialScope}
                  isOwnedByMe={account.isOwnedByMe}
                  ownerStatus={account.ownerStatus}
                  compact={false}
                />
              </div>
            </div>
            <div className="mt-(--space-3) border-t border-border-subtle pt-(--space-2)">
              <div className="flex items-center justify-between gap-(--space-3)">
                <Text size="xs" tone="secondary">
                  {t("accountDetail.currentBalance")}
                </Text>
                <AccountDetailPrivacyToggle />
              </div>
              <Balance
                amountLabel={balanceLabel}
                size={BalanceSize.LG}
                className="mt-(--space-1)"
              />
              <Text size="xs" tone="secondary" className="mt-(--space-1)">
                {account.financialScope === FINANCIAL_SCOPE.HOUSEHOLD
                  ? t("accountDetail.ownershipHint")
                  : account.isOwnedByMe
                    ? t("accountDetail.personalAccountHint")
                    : t("accountDetail.ownershipReadOnly")}
              </Text>
              <div className="mt-(--space-3) flex flex-col gap-(--space-2)">
                {health === AccountHealthSignal.ZERO ? (
                  <Text
                    size="sm"
                    tone="secondary"
                    data-testid="account-health-zero"
                  >
                    {t("accountDetail.healthZero")}
                  </Text>
                ) : null}
              </div>
            </div>
          </Card>
        </MotionReveal>
        {account.canMutate ? (
          <AccountDetailQuickActions accountId={account.id} />
        ) : null}
        <Suspense
          fallback={
            <AccountRecentActivityFallback
              title={t("accountDetail.recentTitle")}
            />
          }
        >
          <AccountRecentActivitySection
            recentPromise={recentPromise}
            accountId={account.id}
            locale={locale}
          />
        </Suspense>
        <AccountDetailManagement
          accountId={account.id}
          initialName={account.name}
          initialType={account.type}
          initialIconKey={account.iconKey}
          canMutate={account.canMutate}
          presentation="settings"
          financialScope={account.financialScope}
          isOwnedByMe={account.isOwnedByMe}
          ownerStatus={account.ownerStatus}
        />
      </div>
    </div>
  );
}

async function CreditCardLinkedPaymentAccountName({
  labelPromise,
}: {
  labelPromise: Promise<string>;
}) {
  const label = await labelPromise;
  return (
    <>
      <span hidden data-testid="card-payment-accounts-ready" />
      {label}
    </>
  );
}

async function CreditCardBillingActivityStream({
  accountId,
  currency,
  itemsPromise,
}: {
  accountId: string;
  currency: string;
  itemsPromise: ReturnType<typeof listCreditCardBillingItems>;
}) {
  return (
    <CreditCardActivitySection
      accountId={accountId}
      currency={currency}
      items={await itemsPromise}
    />
  );
}

function CreditCardQuickActionFallback({
  label,
  testId,
}: {
  label: string;
  testId: string;
}) {
  return (
    <div
      className="flex min-h-12 flex-col items-center justify-center gap-(--space-1) rounded-(--radius-control) border border-border-subtle px-(--space-2) py-(--space-1)"
      role="status"
      aria-busy="true"
      aria-label={label}
      data-testid={testId}
    >
      <SkeletonIcon size="sm" />
      <SkeletonText width="60%" />
    </div>
  );
}

function CreditCardActivityFallback({
  title,
  label,
}: {
  title: string;
  label: string;
}) {
  return (
    <section
      className="flex flex-col gap-(--space-3)"
      aria-busy="true"
      aria-label={label}
      data-testid="card-activity-fallback"
    >
      <SectionHeader
        title={<AccountSectionTitle>{title}</AccountSectionTitle>}
      />
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <ul className={ACCOUNT_ACTIVITY_LIST_CLASS}>
          {Array.from(
            { length: ACCOUNT_DETAIL_PREVIEW_CONFIG.CARD_ACTIVITY_LIMIT },
            (_, index) => (
              <li
                key={index}
                className="flex min-h-14 items-center gap-(--space-3) border-b border-border-subtle py-(--space-2)"
              >
                <SkeletonIcon size="sm" />
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                  <SkeletonText width="80%" />
                  <SkeletonText width="60%" />
                </div>
                <SkeletonAmount />
              </li>
            ),
          )}
        </ul>
      </Card>
    </section>
  );
}

async function AccountRecentActivitySection({
  recentPromise,
  accountId,
  locale,
}: {
  recentPromise: ReturnType<typeof listRecentTransactions>;
  accountId: string;
  locale: string;
}) {
  const [recent, t, tCatalog] = await Promise.all([
    recentPromise,
    getTranslations("money"),
    getTranslations("catalog"),
  ]);
  const activityLoadFailed = recent == null;
  const activity = [...(recent ?? [])].sort((left, right) =>
    right.transactionDate.localeCompare(left.transactionDate),
  );
  const activityPeriod = activity[0]?.transactionDate
    ? formatDate(new Date(`${activity[0].transactionDate}T00:00:00Z`), locale, {
        month: "short",
        year: "numeric",
      })
    : undefined;

  return (
    <section
      className="flex flex-col gap-(--space-2)"
      aria-labelledby="account-recent-activity"
      data-testid="account-recent-activity-ready"
    >
      <SectionHeader
        title={
          <AccountSectionTitle id="account-recent-activity">
            {t("accountDetail.recentTitle")}
          </AccountSectionTitle>
        }
        action={
          activityPeriod ? (
            <Text size="xs" tone="secondary">
              {activityPeriod}
            </Text>
          ) : undefined
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
            href={moneyAccountPath(accountId)}
            className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("hub.retry")}
          </Link>
        </div>
      ) : activity.length === 0 ? (
        <EmptyState
          title={t("accountDetail.recentEmpty")}
          description={t("accountDetail.recentEmptyDescription")}
          icon={
            <AppIcon icon={FINANCE_ICONS.account} size={AppIconSize.DISPLAY} />
          }
          className="flex-none py-(--space-4)"
        />
      ) : (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <ul className={ACCOUNT_ACTIVITY_LIST_CLASS}>
            {activity.map((transaction) => {
              const leading = resolveAccountActivityLeading(transaction);
              const transactionTone = leading.isCredit
                ? TransactionAmountTone.CREDIT
                : TransactionAmountTone.DEBIT;

              return (
                <li key={transaction.id}>
                  <Link
                    href={moneyTransactionPath(transaction.id)}
                    className="block rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <TransactionRow
                      leading={
                        <IconContainer tone={leading.iconTone} size="sm">
                          <AppIcon icon={leading.icon} size={AppIconSize.SM} />
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
                      currency=""
                      tone={transactionTone}
                      showChevron
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {!activityLoadFailed && activity.length > 0 ? (
        <AccountViewActivityAction
          accountId={accountId}
          testId="account-quick-activity"
        />
      ) : null}
    </section>
  );
}

function AccountRecentActivityFallback({ title }: { title: string }) {
  return (
    <section
      className="flex flex-col gap-(--space-2)"
      aria-labelledby="account-recent-activity"
      aria-busy="true"
      data-testid="account-recent-activity-fallback"
    >
      <SectionHeader
        title={
          <AccountSectionTitle id="account-recent-activity">
            {title}
          </AccountSectionTitle>
        }
      />
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <ul className={ACCOUNT_ACTIVITY_LIST_CLASS}>
          {Array.from(
            { length: ACCOUNT_DETAIL_PREVIEW_CONFIG.RECENT_ACTIVITY_LIMIT },
            (_, index) => (
              <li
                key={index}
                className="flex min-h-14 items-center gap-(--space-3) border-b border-border-subtle py-(--space-2)"
              >
                <SkeletonIcon size="sm" />
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                  <SkeletonText width="80%" />
                  <SkeletonText width="60%" />
                </div>
                <SkeletonAmount />
              </li>
            ),
          )}
        </ul>
      </Card>
    </section>
  );
}
