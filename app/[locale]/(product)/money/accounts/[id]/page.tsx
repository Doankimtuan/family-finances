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
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyAccountPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
import { Card } from "@/shared/patterns/card";
import { Balance } from "@/shared/patterns/balance";
import { BalanceSize } from "@/shared/patterns/financial-display-size";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
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
import { CreditCardDetailActions } from "./credit-card-detail-actions";
import { CreditCardHero } from "./credit-card-hero";
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
  const activity = [...(recent ?? [])].sort((left, right) =>
    right.transactionDate.localeCompare(left.transactionDate),
  );
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
      initialIconKey={account.iconKey}
      canMutate={account.canMutate}
      settingsTrigger
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
          backHref={APP_PATH.MONEY_ACCOUNTS}
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
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_ACCOUNTS}
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
          <CreditCardDetailActions
            card={card}
            liquidAccounts={liquidAccounts}
            currency={currency}
            installments={installments ?? []}
            eligiblePurchases={eligiblePurchases ?? []}
            canMutate={account.canMutate}
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
  const activityPeriod = activity[0]?.transactionDate
    ? formatDate(new Date(`${activity[0].transactionDate}T00:00:00Z`), locale, {
        month: "short",
        year: "numeric",
      })
    : undefined;

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-account-detail"
    >
      <TopAppBar
        variant="detail"
        backHref={APP_PATH.MONEY_ACCOUNTS}
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
        <section
          className="flex flex-col gap-(--space-2)"
          aria-labelledby="account-recent-activity"
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
                href={moneyAccountPath(account.id)}
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
                <AppIcon
                  icon={FINANCE_ICONS.account}
                  size={AppIconSize.DISPLAY}
                />
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
                              <AppIcon
                                icon={leading.icon}
                                size={AppIconSize.SM}
                              />
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
              accountId={account.id}
              testId="account-quick-activity"
            />
          ) : null}
        </section>
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
