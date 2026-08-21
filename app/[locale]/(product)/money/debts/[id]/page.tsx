import type { ReactNode } from "react";
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
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { DebtDueBadge, DebtProgressSummary } from "../debt-presentation";
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
      <div
        className="flex min-h-full flex-col"
        data-testid="debt-detail-read-error"
      >
        <TopAppBar title={t("title")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="danger"
            title={t("readErrorTitle")}
            description={t("readErrorDescription")}
            action={
              <Link
                href={moneyDebtPath(id)}
                className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="debt-detail-retry"
              >
                {t("retry")}
              </Link>
            }
          />
          <Link
            href={APP_PATH.MONEY_DEBTS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }
  if (debtResult.status === DebtReadStatus.NOT_FOUND) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="debt-detail-missing"
      >
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.MONEY_DEBTS}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("back")}
          </Link>
        </div>
      </div>
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
  const remainingLabel = isBorrowed
    ? t("remainingToPay")
    : t("remainingToReceive");
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
  return (
    <div className="flex min-h-full flex-col" data-testid="debt-detail">
      <TopAppBar
        title={debt.counterparty}
        subtitle={relationshipLabel}
        backHref={APP_PATH.MONEY_DEBTS}
      />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <MotionReveal>
          <Card className="gap-(--space-4) p-(--space-4)">
            <IconContainer tone={isBorrowed ? "debt" : "income"} size="md">
              <AppIcon
                icon={isBorrowed ? FINANCE_ICONS.debt : FINANCE_ICONS.income}
                size="lg"
              />
            </IconContainer>
            <div className="flex items-start justify-between gap-(--space-3)">
              <div>
                <Amount
                  label={remainingLabel}
                  amountLabel={formatCurrency(
                    debt.remainingAmount,
                    debt.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                  size="lg"
                  amountClassName={isBorrowed ? "text-debt" : "text-income"}
                />
              </div>
              <DebtDueBadge
                due={due}
                dueDate={debt.dueDate}
                labels={dueLabels}
                locale={locale}
              />
            </div>
            <DebtProgressSummary
              direction={debt.direction}
              progress={progress}
              currency={debt.currency}
              locale={locale}
              labels={progressLabels}
            />
          </Card>
        </MotionReveal>
        <MotionReveal>
          <Section
            title={t("details")}
            testId="debt-detail-facts"
            contentClassName="gap-0"
          >
            <dl className="divide-y divide-border-subtle">
              <DebtFact label={t("counterparty")} value={debt.counterparty} />
              <DebtFact
                label={t("originalPrincipal")}
                value={
                  <FinancialValue>
                    {formatCurrency(
                      debt.principalAmount,
                      debt.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                }
              />
              <DebtFact
                label={isBorrowed ? tDebts("paid") : tDebts("received")}
                value={
                  <FinancialValue>
                    {formatCurrency(
                      progress.paidAmount,
                      debt.currency,
                      locale,
                      {
                        maximumFractionDigits: 0,
                      },
                    )}
                  </FinancialValue>
                }
              />
              {debt.openingPaidAmount > 0 ? (
                <DebtFact
                  label={t("openingPaid")}
                  value={
                    <FinancialValue>
                      {formatCurrency(
                        debt.openingPaidAmount,
                        debt.currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      )}
                    </FinancialValue>
                  }
                />
              ) : null}
              <DebtFact
                label={t("startDate")}
                value={formatFactDate(debt.startDate)}
              />
              {debt.dueDate ? (
                <DebtFact
                  label={t("dueDateLabel")}
                  value={formatFactDate(debt.dueDate)}
                />
              ) : null}
              {debt.note ? (
                <DebtFact label={t("note")} value={debt.note} />
              ) : null}
              {originAccountName ? (
                <DebtFact
                  label={t("originAccount")}
                  value={originAccountName}
                />
              ) : null}
              {debt.originTransactionId ? (
                <DebtFact
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
            </dl>
            <FinancialOwnershipBadge
              financialScope={debt.ownership.financialScope}
              isOwnedByMe={debt.ownership.isOwnedByMe}
              ownerStatus={debt.ownership.ownerStatus}
              showExplanation
            />
          </Section>
        </MotionReveal>
        {canMutate && !debt.isArchived ? (
          <MotionReveal>
            <DebtEditSheet
              debtId={debt.id}
              counterparty={debt.counterparty}
              dueDate={debt.dueDate}
              note={debt.note}
              startDate={debt.startDate}
            />
          </MotionReveal>
        ) : null}
        {debt.status === DebtStatus.ACTIVE && canMutate ? (
          <MotionReveal>
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
          </MotionReveal>
        ) : debt.status === DebtStatus.COMPLETED ? (
          <MotionReveal>
            <Text size="sm" tone="secondary">
              {t("paidOff")}
            </Text>
          </MotionReveal>
        ) : (
          <MotionReveal>
            <FinancialOwnershipBadge
              financialScope={debt.ownership.financialScope}
              isOwnedByMe={debt.ownership.isOwnedByMe}
              ownerStatus={debt.ownership.ownerStatus}
              showExplanation
            />
          </MotionReveal>
        )}
        <MotionReveal>
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
        </MotionReveal>
      </div>
    </div>
  );
}

function DebtFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-(--space-3) py-(--space-3)">
      <dt className="min-w-0 text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[62%] text-right text-sm font-medium tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}
