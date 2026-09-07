import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import {
  DebtDirection,
  DebtReadStatus,
  DebtStatus,
  getDebtReadResult,
  getDebtDueInfo,
  getDebtPaymentReconciliation,
  getDebtProgress,
  isDebtMovementAccountType,
  listAccounts,
  listDebtPaymentsReadResult,
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyDebtPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  formatCurrency,
  formatDate as formatLocalizedDate,
} from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Text } from "@/shared/ui/text";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { DebtFactRow, DebtFactsCard } from "../debt-facts";
import { DebtDetailHero } from "../debt-presentation";
import { DebtPrivacyToggle } from "../debt-privacy-toggle";
import { DebtUnavailable } from "../debt-unavailable";
import { DebtPaymentHistory } from "./debt-payment-history";
import { DebtPaymentSheet } from "./debt-payment-sheet";
import { DebtEditSheet } from "./debt-edit-sheet";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function DebtDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }
  const [t, tDebts, tCatalog, debtResult, accountsResult, paymentsResult] =
    await Promise.all([
      getTranslations("money.debtDetail"),
      getTranslations("money.debtsPage"),
      getTranslations("catalog"),
      getDebtReadResult(id),
      listAccounts(),
      listDebtPaymentsReadResult(id),
    ]);
  if (debtResult.status === DebtReadStatus.ERROR) {
    return (
      <Page
        testId="debt-detail-read-error"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("title")}
            backHref={APP_PATH.MONEY_DEBTS}
          />
        }
      >
        <DebtUnavailable
          title={t("readErrorTitle")}
          description={t("readErrorDescription")}
          actionHref={moneyDebtPath(id)}
          actionLabel={t("retry")}
          testId="debt-detail-retry"
        />
      </Page>
    );
  }
  if (debtResult.status === DebtReadStatus.NOT_FOUND) {
    return (
      <Page
        testId="debt-detail-missing"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("title")}
            backHref={APP_PATH.MONEY_DEBTS}
          />
        }
      >
        <DebtUnavailable
          title={t("notFound")}
          actionHref={APP_PATH.MONEY_DEBTS}
          actionLabel={t("back")}
        />
      </Page>
    );
  }
  const debt = debtResult.debt;
  const today = todayIsoDate();
  const isBorrowed = debt.direction === DebtDirection.BORROWED;
  const canMutate = debt.ownership.canMutate;
  const progress = getDebtProgress(debt);
  const due = getDebtDueInfo(debt, today);
  const payments =
    paymentsResult.status === DebtReadStatus.OK ? paymentsResult.payments : [];
  const localizedPayments = payments.map((payment) => ({
    ...payment,
    accountName: localizeCatalogName(
      tCatalog,
      CatalogGroup.ACCOUNTS,
      payment.accountName,
    ),
  }));
  const reconciliation =
    paymentsResult.status === DebtReadStatus.OK
      ? getDebtPaymentReconciliation(debt, payments)
      : null;
  const originAccountName = localizeCatalogName(
    tCatalog,
    CatalogGroup.ACCOUNTS,
    accountsResult?.accounts.find(
      (account) => account.id === debt.originAccountId,
    )?.name,
  );
  const formatFactDate = (isoDate: string) =>
    formatLocalizedDate(new Date(`${isoDate}T00:00:00Z`), locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const accounts = (accountsResult?.accounts ?? [])
    .filter((account) => isDebtMovementAccountType(account.type))
    .map((account) => ({
      id: account.id,
      name: localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, account.name),
      balance: account.balance,
    }));
  const relationshipLabel = isBorrowed ? t("youOwe") : t("owedYou");
  const dueLabels = {
    dueDate: (date: string) => tDebts("dueDate", { date }),
    today: tDebts("dueToday"),
    daysLeft: (days: number) => tDebts("daysLeft", { days }),
    daysOverdue: (days: number) => tDebts("daysOverdue", { days }),
    completed: t("paidOff"),
  };
  const progressLabels = {
    paid: tDebts("paid"),
    received: tDebts("received"),
  };
  const canRecordPayment = debt.status === DebtStatus.ACTIVE && canMutate;

  return (
    <Page
      testId="debt-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={debt.counterparty}
          subtitle={relationshipLabel}
          backHref={APP_PATH.MONEY_DEBTS}
          trailing={
            canMutate && !debt.isArchived ? (
              <DebtEditSheet
                debtId={debt.id}
                counterparty={debt.counterparty}
                dueDate={debt.dueDate}
                note={debt.note}
                startDate={debt.startDate}
                compactTrigger
              />
            ) : undefined
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <MotionReveal>
        <DebtDetailHero
          direction={debt.direction}
          remainingAmount={debt.remainingAmount}
          due={due}
          dueDate={debt.dueDate}
          progress={progress}
          currency={debt.currency}
          locale={locale}
          trailing={
            <DebtPrivacyToggle testId="debt-detail-financial-privacy-toggle" />
          }
          context={
            <FinancialOwnershipBadge
              financialScope={debt.ownership.financialScope}
              isOwnedByMe={debt.ownership.isOwnedByMe}
              ownerStatus={debt.ownership.ownerStatus}
              showExplanation
              onHero
            />
          }
          labels={{
            ...dueLabels,
            ...progressLabels,
            remainingToPay: t("remainingToPay"),
            remainingToReceive: t("remainingToReceive"),
          }}
        />
      </MotionReveal>
      <DebtFactsCard title={t("details")} testId="debt-detail-facts">
        <DebtFactRow label={t("counterparty")} value={debt.counterparty} />
        <DebtFactRow
          label={t("originalPrincipal")}
          value={
            <FinancialValue>
              {formatCurrency(debt.principalAmount, debt.currency, locale, {
                maximumFractionDigits: 0,
              })}
            </FinancialValue>
          }
          emphasis
        />
        <DebtFactRow
          label={isBorrowed ? tDebts("paid") : tDebts("received")}
          value={
            <FinancialValue>
              {formatCurrency(progress.paidAmount, debt.currency, locale, {
                maximumFractionDigits: 0,
              })}
            </FinancialValue>
          }
        />
        {debt.openingPaidAmount > 0 ? (
          <DebtFactRow
            label={t("openingPaid")}
            value={
              <FinancialValue>
                {formatCurrency(debt.openingPaidAmount, debt.currency, locale, {
                  maximumFractionDigits: 0,
                })}
              </FinancialValue>
            }
          />
        ) : null}
        <DebtFactRow
          label={t("startDate")}
          value={formatFactDate(debt.startDate)}
        />
        {debt.dueDate ? (
          <DebtFactRow
            label={t("dueDateLabel")}
            value={formatFactDate(debt.dueDate)}
          />
        ) : null}
        {debt.note ? <DebtFactRow label={t("note")} value={debt.note} /> : null}
        {originAccountName ? (
          <DebtFactRow label={t("originAccount")} value={originAccountName} />
        ) : null}
        {debt.originTransactionId ? (
          <DebtFactRow
            label={t("originTransaction")}
            value={
              <Link
                href={moneyTransactionPath(debt.originTransactionId)}
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("viewTransaction")}
              </Link>
            }
          />
        ) : null}
      </DebtFactsCard>
      {debt.status === DebtStatus.COMPLETED ? (
        <Text size="sm" tone="secondary" className="text-pretty">
          {t("paidOff")}
        </Text>
      ) : null}
      <DebtPaymentHistory
        title={t("history")}
        countLabel={t("historyCount", {
          count: payments.length + (debt.openingPaidAmount > 0 ? 1 : 0),
        })}
        emptyTitle={
          debt.status === DebtStatus.COMPLETED
            ? t("paidOff")
            : isBorrowed
              ? t("noRepayments")
              : t("noReceipts")
        }
        accountFallback={t("historyAccountFallback")}
        isBorrowed={isBorrowed}
        payments={localizedPayments}
        formatAmount={(amount) =>
          formatCurrency(amount, debt.currency, locale, {
            maximumFractionDigits: 0,
          })
        }
        formatDate={(isoDate) => formatFactDate(isoDate)}
        transactionPath={moneyTransactionPath}
        retryHref={moneyDebtPath(debt.id)}
        readError={paymentsResult.status === DebtReadStatus.ERROR}
        readErrorTitle={t("historyReadErrorTitle")}
        readErrorDescription={t("historyReadErrorDescription")}
        retryLabel={t("retry")}
        openingPaidAmount={
          paymentsResult.status === DebtReadStatus.OK
            ? debt.openingPaidAmount
            : 0
        }
        openingLabel={t("openingPaid")}
        totalLabel={t("historyTotal")}
        reconciliationWarning={
          reconciliation && !reconciliation.isReconciled
            ? t("historyReconciliationError")
            : undefined
        }
      />
      {canRecordPayment ? (
        <BottomActionBar>
          <DebtPaymentSheet
            debtId={debt.id}
            direction={debt.direction}
            remainingAmount={debt.remainingAmount}
            currency={debt.currency}
            locale={locale}
            accounts={accounts}
            accountsLoadFailed={accountsResult == null}
            today={today}
          />
        </BottomActionBar>
      ) : null}
    </Page>
  );
}
