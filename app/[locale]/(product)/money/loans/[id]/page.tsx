import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import {
  getLoanReadResult,
  isLoanPaymentAccountType,
  listAccounts,
  listLoanInterestRatePeriodsReadResult,
  listLoanPaymentsReadResult,
  listLoanScheduleReadResult,
  LoanInterestStrategy,
  LoanScheduleEntryStatus,
  LoanStatus,
  type LoanScheduleEntry,
} from "@/modules/ledger/application";
import {
  LoanDetailView,
  LoanReadStatus,
  LOAN_DETAIL_VIEW_QUERY,
  type LoanDetailView as LoanDetailViewValue,
} from "@/modules/ledger/application/loan-constants";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import {
  APP_PATH,
  moneyLoanPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  formatLoanDate,
  LoanAmountText,
  LoanDetailHero,
} from "@/modules/ledger/ui/loan-presentation";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { LoanFactRow, LoanFactsCard } from "../loan-facts";
import { LoanPrivacyToggle } from "../loan-privacy-toggle";
import { LoanSectionTitle } from "../loan-section-title";
import { LoanUnavailable } from "../loan-unavailable";
import { LoanCloseAction } from "./loan-close-action";
import {
  LoanPaymentHistoryPanel,
  LoanRateHistoryPanel,
  LoanSchedulePanel,
} from "./loan-detail-panels";
import { LoanDetailWorkspace } from "./loan-detail-workspace";
import { LoanEditAction } from "./loan-edit-action";
import { LoanEditInterestAction } from "./loan-edit-interest-action";
import { LoanPayAction } from "./loan-pay-action";
import { LoanPayoffEstimate } from "./loan-payoff-estimate";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
};

export default async function LoanDetailPage({ params, searchParams }: Props) {
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

  const requestedView = (await searchParams)?.view;
  const initialView = resolveLoanDetailView(
    Array.isArray(requestedView) ? requestedView[0] : requestedView,
  );

  const [
    t,
    tLoans,
    tProducts,
    tCatalog,
    loanResult,
    paymentsResult,
    scheduleResult,
    ratePeriodsResult,
    accountsResult,
  ] = await Promise.all([
    getTranslations("money.loanDetail"),
    getTranslations("money.loansPage"),
    getTranslations("money.products"),
    getTranslations("catalog"),
    getLoanReadResult(id),
    listLoanPaymentsReadResult(id),
    listLoanScheduleReadResult(id),
    listLoanInterestRatePeriodsReadResult(id),
    listAccounts(),
  ]);

  if (loanResult.status === LoanReadStatus.ERROR) {
    return (
      <Page
        testId="loan-detail-read-error"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("title")}
            backHref={APP_PATH.MONEY_LOANS}
          />
        }
      >
        <LoanUnavailable
          title={t("readError")}
          actionHref={moneyLoanPath(id)}
          actionLabel={t("retry")}
        />
      </Page>
    );
  }

  if (loanResult.status === LoanReadStatus.NOT_FOUND) {
    return (
      <Page
        testId="loan-detail-missing"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("title")}
            backHref={APP_PATH.MONEY_LOANS}
          />
        }
      >
        <LoanUnavailable
          title={t("notFound")}
          actionHref={APP_PATH.MONEY_LOANS}
          actionLabel={t("back")}
        />
      </Page>
    );
  }

  const loan = loanResult.loan;
  const today = todayIsoDate();
  const money = (amount: number) =>
    formatCurrency(amount, loan.currency, locale, { maximumFractionDigits: 0 });

  const scheduleEntries =
    scheduleResult.status === LoanReadStatus.OK ? scheduleResult.schedule : [];
  const upcoming = scheduleEntries.filter(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.UPCOMING ||
      entry.status === LoanScheduleEntryStatus.PARTIAL,
  );
  const nextEntry = upcoming[0] ?? null;
  const nextTotal = nextEntry?.totalDue ?? loan.monthlyPayment;
  const dueState = getLoanDueState(
    nextEntry?.dueDate ?? loan.nextPaymentDate,
    today,
  );
  const formattedDueDate = formatLoanDate(
    nextEntry?.dueDate ?? loan.nextPaymentDate,
    locale,
  );
  const dueLabel = tLoans(`dueStates.${dueState}`, {
    date: formattedDueDate ?? "",
  });

  const isActive = loan.status === LoanStatus.ACTIVE;
  const canMutate = loan.ownership.canMutate;
  const canEditInterest =
    isActive &&
    canMutate &&
    (loan.interestStrategy === LoanInterestStrategy.FLOATING ||
      (loan.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING &&
        (!loan.promoRateEffectiveOn || today >= loan.promoRateEffectiveOn)));

  const accounts = (accountsResult?.accounts ?? [])
    .filter(
      (account) => isLoanPaymentAccountType(account.type) && account.canMutate,
    )
    .map((account) => ({
      id: account.id,
      name: localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, account.name),
    }));
  const accountNames = new Map(
    accounts.map((account) => [account.id, account.name]),
  );

  const typeLabel = tLoans(`loanTypes.${loan.loanType}`);
  const subtitle = loan.lender ? `${loan.lender} · ${typeLabel}` : typeLabel;

  const tabs = [
    { view: LoanDetailView.OVERVIEW, label: t("overviewTab") },
    { view: LoanDetailView.SCHEDULE, label: t("scheduleTab") },
    { view: LoanDetailView.HISTORY, label: t("historyTab") },
  ] as const;

  const heroOwnership = (
    <FinancialOwnershipBadge
      financialScope={loan.ownership.financialScope}
      isOwnedByMe={loan.ownership.isOwnedByMe}
      ownerStatus={loan.ownership.ownerStatus}
      showExplanation
      onHero
    />
  );
  const canRecordPayment = isActive && canMutate && nextEntry != null;

  const overview = (
    <div className="flex flex-col gap-(--space-5)">
      {nextEntry ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="loan-next-payment"
        >
          <LoanSectionTitle>{t("nextPaymentSection")}</LoanSectionTitle>
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <dl className="divide-y divide-divider">
              <LoanFactRow
                label={t("nextPaymentAmount")}
                emphasis
                value={
                  <LoanAmountText
                    amount={nextTotal}
                    currency={loan.currency}
                    locale={locale}
                  />
                }
              />
              <LoanFactRow
                label={t("schedulePrincipal")}
                value={
                  <LoanAmountText
                    amount={nextEntry.principalDue}
                    currency={loan.currency}
                    locale={locale}
                  />
                }
              />
              <LoanFactRow
                label={t("scheduleInterest")}
                value={
                  <LoanAmountText
                    amount={nextEntry.interestDue}
                    currency={loan.currency}
                    locale={locale}
                  />
                }
              />
              <LoanFactRow
                label={t("nextPaymentDate")}
                value={
                  formatLoanDate(nextEntry.dueDate, locale) ?? nextEntry.dueDate
                }
              />
            </dl>
            {isActive && canMutate ? (
              <div className="border-t border-divider px-(--space-4) py-(--space-3)">
                <LoanPayoffEstimate
                  remainingPrincipal={loan.remainingPrincipal}
                  currency={loan.currency}
                  asOfDate={today}
                />
              </div>
            ) : null}
          </Card>
        </section>
      ) : isActive && canMutate ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="loan-next-payment-empty"
        >
          <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
            <Text size="sm" tone="secondary">
              {t("noUpcomingPayment")}
            </Text>
            <LoanPayoffEstimate
              remainingPrincipal={loan.remainingPrincipal}
              currency={loan.currency}
              asOfDate={today}
            />
          </Card>
        </section>
      ) : null}

      <LoanFactsCard
        title={t("repaymentSummary")}
        testId="loan-repayment-summary"
      >
        <LoanFactRow
          label={t("originalPrincipal")}
          value={
            <LoanAmountText
              amount={loan.principal}
              currency={loan.currency}
              locale={locale}
            />
          }
        />
        <LoanFactRow
          label={t("principalPaid")}
          value={
            <LoanAmountText
              amount={loan.principalPaid}
              currency={loan.currency}
              locale={locale}
            />
          }
        />
        <LoanFactRow
          label={t("interestPaid")}
          value={
            <LoanAmountText
              amount={loan.interestPaid}
              currency={loan.currency}
              locale={locale}
            />
          }
        />
        <LoanFactRow
          label={t("totalRepayment")}
          emphasis
          value={
            <LoanAmountText
              amount={loan.totalRepayment}
              currency={loan.currency}
              locale={locale}
            />
          }
        />
      </LoanFactsCard>

      <LoanFactsCard title={t("loanTerms")} testId="loan-terms">
        <LoanFactRow
          label={t("interestRate")}
          value={
            loan.annualInterestRate == null
              ? t("unknownValue")
              : `${loan.annualInterestRate}%`
          }
        />
        <LoanFactRow
          label={t("repaymentMethod")}
          value={tLoans(`repaymentMethods.${loan.repaymentMethod}`)}
        />
        <LoanFactRow
          label={t("term")}
          value={t("termMonths", { months: loan.termMonths })}
        />
        <LoanFactRow
          label={t("startDate")}
          value={formatLoanDate(loan.startDate, locale) ?? t("noneValue")}
        />
        <LoanFactRow
          label={t("endDate")}
          value={formatLoanDate(loan.expectedEndDate, locale) ?? t("noneValue")}
        />
        <LoanFactRow
          label={t("lender")}
          value={loan.lender ?? t("noneValue")}
        />
      </LoanFactsCard>

      {loan.note ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="loan-note"
        >
          <LoanSectionTitle>{t("noteLabel")}</LoanSectionTitle>
          <Card tone="elevated" className="p-(--space-4)">
            <Text size="sm" className="text-pretty">
              {loan.note}
            </Text>
          </Card>
        </section>
      ) : null}

      {loan.status === LoanStatus.COMPLETED ? (
        <Card
          tone="elevated"
          className="gap-(--space-3) p-(--space-4)"
          data-testid="loan-completed"
        >
          <Text size="sm">{t("completed")}</Text>
          <Link
            href={APP_PATH.INBOX}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="loan-complete-inbox"
          >
            {t("openInbox")}
          </Link>
        </Card>
      ) : null}
    </div>
  );

  const schedule = (
    <div className="flex flex-col gap-(--space-4)">
      {scheduleResult.status === LoanReadStatus.ERROR ? (
        <StatusAlert
          variant="danger"
          title={t("scheduleError")}
          action={
            <Link
              href={`${moneyLoanPath(id)}?${LOAN_DETAIL_VIEW_QUERY}=${LoanDetailView.SCHEDULE}`}
              className="text-sm font-medium text-accent"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : (
        <>
          <LoanSchedulePanel
            title={t("scheduleTitle")}
            emptyLabel={t("scheduleEmpty")}
            entries={relevantSchedule(scheduleEntries)}
            formatMoney={money}
            t={t}
            today={today}
          />
          <Text size="sm" tone="secondary" className="text-pretty">
            {t("scheduleWindowHint")}
          </Text>
          <Link
            href={`${moneyLoanPath(id)}/schedule`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("viewFullSchedule")}
          </Link>
        </>
      )}
    </div>
  );

  const history = (
    <div className="flex flex-col gap-(--space-4)">
      {paymentsResult.status === LoanReadStatus.ERROR ? (
        <StatusAlert
          variant="danger"
          title={t("historyError")}
          action={
            <Link
              href={`${moneyLoanPath(id)}?${LOAN_DETAIL_VIEW_QUERY}=${LoanDetailView.HISTORY}`}
              className="text-sm font-medium text-accent"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : (
        <LoanPaymentHistoryPanel
          title={t("historyTitle")}
          payments={(paymentsResult.payments ?? []).map((payment) => ({
            id: payment.id,
            accountId: payment.accountId,
            paidAt: payment.paidAt,
            amount: payment.amount,
            principalPaid: payment.principalPaid,
            interestPaid: payment.interestPaid,
            transactionId: payment.transactionId,
          }))}
          formatMoney={money}
          accountNames={accountNames}
          t={t}
        />
      )}

      {ratePeriodsResult.status === LoanReadStatus.ERROR ? (
        <StatusAlert
          variant="danger"
          title={t("rateHistoryError")}
          action={
            <Link
              href={`${moneyLoanPath(id)}?${LOAN_DETAIL_VIEW_QUERY}=${LoanDetailView.HISTORY}`}
              className="text-sm font-medium text-accent"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : (
        <LoanRateHistoryPanel
          title={t("rateHistoryTitle")}
          emptyLabel={t("rateHistoryEmpty")}
          periods={(ratePeriodsResult.periods ?? []).map((period) => ({
            id: period.id,
            effectiveFrom: period.effectiveFrom,
            effectiveTo: period.effectiveTo,
            kind: period.kind,
            annualRate: period.annualRate,
          }))}
          openLabel={t("rateHistoryOpen")}
          kindLabel={(kind) =>
            tLoans(`ratePeriodKinds.${kind}` as "ratePeriodKinds.fixed")
          }
          t={t}
        />
      )}

      {isActive && canMutate ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="loan-secondary-actions"
        >
          <LoanSectionTitle>{t("secondaryActions")}</LoanSectionTitle>
          <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
            {canEditInterest ? (
              <LoanEditInterestAction
                loanId={loan.id}
                currentRate={loan.annualInterestRate ?? 0}
                defaultEffectiveFrom={
                  nextEntry?.dueDate && nextEntry.dueDate > today
                    ? nextEntry.dueDate
                    : loan.nextPaymentDate && loan.nextPaymentDate > today
                      ? loan.nextPaymentDate
                      : today
                }
              />
            ) : null}
            <LoanCloseAction loanId={loan.id} />
          </Card>
        </section>
      ) : null}
    </div>
  );

  return (
    <Page
      testId="loan-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={loan.name}
          subtitle={subtitle}
          backHref={APP_PATH.MONEY_LOANS}
          trailing={
            isActive && canMutate ? (
              <LoanEditAction
                loanId={loan.id}
                initialName={loan.name}
                initialLender={loan.lender ?? ""}
                initialNote={loan.note ?? ""}
                compactTrigger
              />
            ) : undefined
          }
        />
      }
    >
      <MoneyOfflineBanner />
      <MotionReveal>
        <LoanDetailHero
          remainingPrincipal={loan.remainingPrincipal}
          currency={loan.currency}
          locale={locale}
          dueState={dueState}
          dueLabel={dueLabel}
          status={loan.status}
          statusLabel={tLoans(`status.${loan.status}`)}
          nextPaymentAmount={nextEntry ? nextTotal : loan.nextPaymentAmount}
          nextPaymentDate={formattedDueDate}
          progress={loan.progress}
          trailing={
            <LoanPrivacyToggle testId="loan-detail-financial-privacy-toggle" />
          }
          context={heroOwnership}
          labels={{
            remaining: t("remainingLabel"),
            nextPayment: t("nextPaymentAmount"),
            nextPaymentDate: t("nextPaymentDate"),
            progress: tLoans("progress", {
              percent: Math.round(loan.progress * 100),
            }),
            none: t("noneValue"),
          }}
        />
      </MotionReveal>
      <Text size="xs" tone="secondary" className="text-pretty">
        {tProducts("notBankBalance")}
      </Text>
      <LoanDetailWorkspace
        initialView={initialView}
        tabs={tabs}
        overview={overview}
        schedule={schedule}
        history={history}
      />
      {canRecordPayment && nextEntry ? (
        <BottomActionBar>
          <LoanPayAction
            loanId={loan.id}
            loanName={loan.name}
            currency={loan.currency}
            principalDue={nextEntry.principalDue}
            interestDue={nextEntry.interestDue}
            totalDue={nextTotal}
            remainingPrincipal={loan.remainingPrincipal}
            accounts={accounts}
            paidAtDefault={today}
          />
        </BottomActionBar>
      ) : null}
    </Page>
  );
}

function relevantSchedule(entries: LoanScheduleEntry[]): LoanScheduleEntry[] {
  const ordered = [...entries].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  const nextIndex = ordered.findIndex(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.UPCOMING ||
      entry.status === LoanScheduleEntryStatus.PARTIAL,
  );
  const start =
    nextIndex < 0
      ? Math.max(0, ordered.length - 4)
      : Math.max(0, nextIndex - 1);
  return ordered.slice(start, start + 4);
}

function resolveLoanDetailView(value: string | undefined): LoanDetailViewValue {
  if (value === LoanDetailView.SCHEDULE) return LoanDetailView.SCHEDULE;
  if (value === LoanDetailView.HISTORY) return LoanDetailView.HISTORY;
  return LoanDetailView.OVERVIEW;
}
