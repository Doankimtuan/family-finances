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
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Section, SectionVariant } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  formatLoanDate,
  LoanAmountText,
  LoanDetailHero,
  LoanFact,
} from "@/modules/ledger/ui/loan-presentation";
import { MoneyOfflineBanner } from "../../money-offline-banner";
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
      <div
        className="flex min-h-full flex-col"
        data-testid="loan-detail-read-error"
      >
        <TopAppBar
          variant="detail"
          title={t("title")}
          backHref={APP_PATH.MONEY_LOANS}
        />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="danger"
            title={t("readError")}
            action={
              <Link
                href={moneyLoanPath(id)}
                className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("retry")}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (loanResult.status === LoanReadStatus.NOT_FOUND) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="loan-detail-missing"
      >
        <TopAppBar
          variant="detail"
          title={t("title")}
          backHref={APP_PATH.MONEY_LOANS}
        />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
        </div>
      </div>
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

  const ownershipBadge = (
    <FinancialOwnershipBadge
      financialScope={loan.ownership.financialScope}
      isOwnedByMe={loan.ownership.isOwnedByMe}
      ownerStatus={loan.ownership.ownerStatus}
      showExplanation
    />
  );

  const overview = (
    <div className="flex flex-col gap-(--space-4)">
      {nextEntry ? (
        <Section
          title={t("nextPaymentSection")}
          description={ownershipBadge}
          variant={SectionVariant.SURFACE}
          testId="loan-next-payment"
          contentClassName="gap-(--space-3)"
        >
          <Text size="sm" weight="medium" className="text-pretty">
            {t("nextDueLead", {
              amount: money(nextTotal),
              date:
                formatLoanDate(nextEntry.dueDate, locale) ?? nextEntry.dueDate,
            })}
          </Text>
          <Text size="sm" tone="secondary" className="text-pretty">
            <FinancialValue>
              {t("nextDueSplit", {
                principal: money(nextEntry.principalDue),
                interest: money(nextEntry.interestDue),
              })}
            </FinancialValue>
          </Text>
          {isActive && canMutate ? (
            <div className="flex flex-col gap-(--space-2)">
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
              <LoanPayoffEstimate
                remainingPrincipal={loan.remainingPrincipal}
                currency={loan.currency}
                asOfDate={today}
              />
            </div>
          ) : null}
        </Section>
      ) : isActive && canMutate ? (
        <Section
          description={ownershipBadge}
          variant={SectionVariant.SURFACE}
          testId="loan-next-payment-empty"
        >
          <Text size="sm" tone="secondary">
            {t("noUpcomingPayment")}
          </Text>
          <LoanPayoffEstimate
            remainingPrincipal={loan.remainingPrincipal}
            currency={loan.currency}
            asOfDate={today}
          />
        </Section>
      ) : null}

      <Section
        title={t("repaymentSummary")}
        description={
          !nextEntry && !(isActive && canMutate) ? ownershipBadge : undefined
        }
        variant={SectionVariant.SURFACE}
        testId="loan-repayment-summary"
        contentClassName="gap-0"
      >
        <dl className="divide-y divide-border-subtle">
          <LoanFact
            label={t("originalPrincipal")}
            value={
              <LoanAmountText
                amount={loan.principal}
                currency={loan.currency}
                locale={locale}
              />
            }
          />
          <LoanFact
            label={t("principalPaid")}
            value={
              <LoanAmountText
                amount={loan.principalPaid}
                currency={loan.currency}
                locale={locale}
              />
            }
          />
          <LoanFact
            label={t("interestPaid")}
            value={
              <LoanAmountText
                amount={loan.interestPaid}
                currency={loan.currency}
                locale={locale}
              />
            }
          />
          <LoanFact
            label={t("totalRepayment")}
            value={
              <LoanAmountText
                amount={loan.totalRepayment}
                currency={loan.currency}
                locale={locale}
              />
            }
          />
        </dl>
      </Section>

      <Section
        title={t("loanTerms")}
        variant={SectionVariant.SURFACE}
        testId="loan-terms"
        contentClassName="gap-0"
      >
        <dl className="divide-y divide-border-subtle">
          <LoanFact
            label={t("interestRate")}
            value={
              loan.annualInterestRate == null
                ? t("unknownValue")
                : `${loan.annualInterestRate}%`
            }
          />
          <LoanFact
            label={t("repaymentMethod")}
            value={tLoans(`repaymentMethods.${loan.repaymentMethod}`)}
          />
          <LoanFact
            label={t("term")}
            value={t("termMonths", { months: loan.termMonths })}
          />
          <LoanFact
            label={t("startDate")}
            value={formatLoanDate(loan.startDate, locale) ?? t("noneValue")}
          />
          <LoanFact
            label={t("endDate")}
            value={
              formatLoanDate(loan.expectedEndDate, locale) ?? t("noneValue")
            }
          />
          <LoanFact label={t("lender")} value={loan.lender ?? t("noneValue")} />
        </dl>
      </Section>

      {loan.note ? (
        <Section
          title={t("noteLabel")}
          variant={SectionVariant.SURFACE}
          testId="loan-note"
        >
          <Text size="sm" className="text-pretty">
            {loan.note}
          </Text>
        </Section>
      ) : null}

      {loan.status === LoanStatus.COMPLETED ? (
        <Section variant={SectionVariant.SURFACE} testId="loan-completed">
          <Text size="sm">{t("completed")}</Text>
          <Link
            href={APP_PATH.INBOX}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="loan-complete-inbox"
          >
            {t("openInbox")}
          </Link>
        </Section>
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
        <Section
          title={t("secondaryActions")}
          variant={SectionVariant.SURFACE}
          testId="loan-secondary-actions"
          contentClassName="gap-(--space-3)"
        >
          <LoanEditAction
            loanId={loan.id}
            initialName={loan.name}
            initialLender={loan.lender ?? ""}
            initialNote={loan.note ?? ""}
          />
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
        </Section>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-full flex-col" data-testid="loan-detail">
      <TopAppBar
        variant="detail"
        title={loan.name}
        subtitle={subtitle}
        backHref={APP_PATH.MONEY_LOANS}
      />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary" className="text-pretty">
          {tProducts("notBankBalance")}
        </Text>

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

        <LoanDetailWorkspace
          initialView={initialView}
          tabs={tabs}
          overview={overview}
          schedule={schedule}
          history={history}
        />
      </div>
    </div>
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
