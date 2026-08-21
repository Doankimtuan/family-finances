import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyLoanPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getLoanReadResult,
  listLoanPaymentsReadResult,
  listLoanInterestRatePeriodsReadResult,
  listLoanScheduleReadResult,
  listAccounts,
} from "@/modules/ledger/application";
import {
  AccountType,
  LoanInterestStrategy,
  LoanScheduleEntryStatus,
  LoanStatus,
  LoanReadStatus,
  LoanDueState,
  LoanDetailView,
  LOAN_DETAIL_VIEW_QUERY,
} from "@/modules/ledger/application/ledger-constants";
import type { LoanScheduleEntry } from "@/modules/ledger/application/money-product-types";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { LoanPayAction } from "./loan-pay-action";
import { LoanPayoffEstimate } from "./loan-payoff-estimate";
import { LoanEditAction } from "./loan-edit-action";
import { LoanEditInterestAction } from "./loan-edit-interest-action";
import { LoanCloseAction } from "./loan-close-action";
import {
  LoanPaymentHistoryPanel,
  LoanRateHistoryPanel,
  LoanSchedulePanel,
} from "./loan-detail-panels";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ view?: string }>;
};

/** money.loans detail — schedule-driven payments; complete → Inbox. */
export default async function LoanDetailPage({ params, searchParams }: Props) {
  const { locale: raw, id } = await params;
  const requestedView = (await searchParams)?.view;
  const view = resolveLoanDetailView(requestedView);
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [
    t,
    tLoans,
    tProducts,
    loanResult,
    paymentsResult,
    scheduleResult,
    ratePeriods,
    accountsResult,
    messages,
  ] = await Promise.all([
    getTranslations("money.loanDetail"),
    getTranslations("money.loansPage"),
    getTranslations("money.products"),
    getLoanReadResult(id),
    listLoanPaymentsReadResult(id),
    listLoanScheduleReadResult(id),
    listLoanInterestRatePeriodsReadResult(id),
    listAccounts(),
    getMessages(),
  ]);

  if (loanResult.status === LoanReadStatus.ERROR) {
    return (
      <LoanReadError
        title={t("readError")}
        retryLabel={t("retry")}
        retryHref={moneyLoanPath(id)}
      />
    );
  }
  if (loanResult.status === LoanReadStatus.NOT_FOUND) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="loan-detail-missing"
      >
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.MONEY_LOANS}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  const loan = loanResult.loan;
  const payments = paymentsResult;
  const schedule = scheduleResult;

  const liquidAccounts = (accountsResult?.accounts ?? []).filter(
    (account) => account.type !== AccountType.CREDIT_CARD,
  );

  const scheduleList =
    schedule.status === LoanReadStatus.OK ? schedule.schedule : [];
  const upcoming = scheduleList.filter(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.UPCOMING ||
      entry.status === LoanScheduleEntryStatus.PARTIAL,
  );
  const nextEntry = upcoming[0] ?? null;
  const isActive = loan.status === LoanStatus.ACTIVE;
  const canMutate = loan.ownership.canMutate;
  const today = todayIsoDate();
  const canEditInterest =
    isActive &&
    (loan.interestStrategy === LoanInterestStrategy.FLOATING ||
      (loan.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING &&
        (!loan.promoRateEffectiveOn || today >= loan.promoRateEffectiveOn)));

  const money = (n: number) =>
    formatCurrency(n, loan.currency, locale, { maximumFractionDigits: 0 });

  const nextTotal = nextEntry?.totalDue ?? loan.monthlyPayment;
  const tCatalog = await getTranslations("catalog");
  const localizedAccounts = (accountsResult?.accounts ?? []).map((account) => ({
    ...account,
    name: localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, account.name),
  }));

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-full flex-col" data-testid="loan-detail">
        <TopAppBar
          title={loan.name}
          subtitle={
            loan.lender
              ? `${loan.lender} · ${tLoans(`loanTypes.${loan.loanType}`)}`
              : tLoans(`loanTypes.${loan.loanType}`)
          }
        />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <Text size="sm" tone="secondary">
            {tProducts("notBankBalance")}
          </Text>
          <nav
            className="flex gap-(--space-1) rounded-(--radius-control) bg-surface-muted/60 p-(--space-1)"
            aria-label={t("title")}
            data-testid="loan-detail-tabs"
          >
            {[
              [LoanDetailView.OVERVIEW, t("overviewTab")],
              [LoanDetailView.SCHEDULE, t("scheduleTab")],
              [LoanDetailView.HISTORY, t("historyTab")],
            ].map(([tab, label]) => (
              <Link
                key={tab}
                href={`${moneyLoanPath(id)}?${LOAN_DETAIL_VIEW_QUERY}=${tab}`}
                aria-current={view === tab ? "page" : undefined}
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-(--radius-control) px-(--space-2) text-center text-xs font-medium focus-visible:outline-2 focus-visible:outline-focus-ring ${view === tab ? "bg-surface text-text-primary shadow-(--elevation-1)" : "text-text-secondary hover:bg-surface-hover"}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <section
            className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-debt/35 bg-debt-soft/20 p-(--space-4) shadow-[var(--elevation-1)]"
            data-testid="loan-summary"
          >
            <FinancialOwnershipBadge
              financialScope={loan.ownership.financialScope}
              isOwnedByMe={loan.ownership.isOwnedByMe}
              ownerStatus={loan.ownership.ownerStatus}
              showExplanation
            />
            <Amount
              label={t("remainingLabel")}
              amountLabel={money(loan.remainingPrincipal)}
              size="lg"
              amountClassName="text-debt"
            />
            <dl className="grid grid-cols-2 gap-x-(--space-4) gap-y-(--space-3) border-t border-border-subtle pt-(--space-3)">
              <LoanFact
                label={t("originalPrincipal")}
                value={<FinancialValue>{money(loan.principal)}</FinancialValue>}
              />
              <LoanFact
                label={t("interestRate")}
                value={
                  loan.annualInterestRate == null
                    ? t("unknownValue")
                    : `${loan.annualInterestRate}%`
                }
              />
              <LoanFact
                label={t("nextPaymentAmount")}
                value={
                  nextEntry ? (
                    <FinancialValue>{money(nextTotal)}</FinancialValue>
                  ) : (
                    t("noneValue")
                  )
                }
              />
              <LoanFact
                label={t("nextPaymentDate")}
                value={
                  nextEntry?.dueDate ?? loan.nextPaymentDate ?? t("noneValue")
                }
              />
              <LoanFact label={t("startDate")} value={loan.startDate} />
              <LoanFact
                label={t("endDate")}
                value={loan.expectedEndDate ?? t("noneValue")}
              />
              <LoanFact
                label={t("lender")}
                value={loan.lender ?? t("noneValue")}
              />
            </dl>
            <Text size="sm" tone="secondary">
              {t("recordedPrincipalCaveat")}
            </Text>
            {nextEntry ? (
              <div className="flex flex-col gap-(--space-1) rounded-[var(--radius-control)] border border-accent/25 bg-accent-soft/45 px-(--space-3) py-(--space-2)">
                <Text
                  size="sm"
                  className="font-medium text-text-primary text-wrap-pretty"
                >
                  <FinancialValue>
                    {t("nextDueLead", {
                      amount: money(nextTotal),
                      date: nextEntry.dueDate,
                    })}
                  </FinancialValue>
                </Text>
                <Text size="sm" tone="secondary" className="text-wrap-pretty">
                  <FinancialValue>
                    {t("nextDueSplit", {
                      principal: money(nextEntry.principalDue),
                      interest: money(nextEntry.interestDue),
                    })}
                  </FinancialValue>
                </Text>
              </div>
            ) : loan.nextPaymentDate ? (
              <Text size="sm" tone="secondary">
                {t("nextPaymentLabel", { date: loan.nextPaymentDate })}
              </Text>
            ) : null}
            <Text
              size="sm"
              tone="secondary"
              className={dueStateClass(
                nextEntry
                  ? getLoanDueState(nextEntry.dueDate, today)
                  : LoanDueState.NONE,
              )}
            >
              {t(
                `dueStates.${nextEntry ? getLoanDueState(nextEntry.dueDate, today) : LoanDueState.NONE}`,
              )}
            </Text>
            <Text size="sm" tone="secondary" className="text-success">
              {tLoans("progress", { percent: Math.round(loan.progress * 100) })}
            </Text>
          </section>
          {view === LoanDetailView.OVERVIEW ? (
            <>
              <Text size="sm" tone="secondary">
                {t("ownershipLabel")}: {loan.ownership.ownerStatus}
              </Text>
              {loan.note ? (
                <Text size="sm" tone="secondary">
                  {t("noteLabel")}: {loan.note}
                </Text>
              ) : null}
            </>
          ) : null}

          {schedule.status === LoanReadStatus.ERROR ? (
            <ErrorState
              title={t("scheduleError")}
              action={
                <Link
                  href={moneyLoanPath(id)}
                  className="text-sm font-medium text-accent"
                >
                  {t("retry")}
                </Link>
              }
            />
          ) : null}

          {view === LoanDetailView.OVERVIEW &&
          loan.status === LoanStatus.COMPLETED ? (
            <>
              <Text size="sm">{t("completed")}</Text>
              <Link
                href={APP_PATH.INBOX}
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent"
                data-testid="loan-complete-inbox"
              >
                {t("openInbox")}
              </Link>
            </>
          ) : view === LoanDetailView.OVERVIEW && isActive && canMutate ? (
            <>
              {nextEntry ? (
                <LoanPayAction
                  loanId={loan.id}
                  loanName={loan.name}
                  currency={loan.currency}
                  principalDue={nextEntry.principalDue}
                  interestDue={nextEntry.interestDue}
                  totalDue={nextTotal}
                  remainingPrincipal={loan.remainingPrincipal}
                  accounts={liquidAccounts.map((a) => ({
                    id: a.id,
                    name: localizeCatalogName(
                      tCatalog,
                      CatalogGroup.ACCOUNTS,
                      a.name,
                    ),
                  }))}
                  paidAtDefault={today}
                />
              ) : (
                <Text size="sm" tone="secondary">
                  {t("noUpcomingPayment")}
                </Text>
              )}
              <LoanPayoffEstimate
                remainingPrincipal={loan.remainingPrincipal}
                currency={loan.currency}
                asOfDate={today}
              />
            </>
          ) : view === LoanDetailView.OVERVIEW && isActive ? (
            <FinancialOwnershipBadge
              financialScope={loan.ownership.financialScope}
              isOwnedByMe={loan.ownership.isOwnedByMe}
              ownerStatus={loan.ownership.ownerStatus}
              showExplanation
            />
          ) : (
            <Text size="sm" tone="secondary">
              {tLoans(`status.${loan.status}`)}
            </Text>
          )}

          {view === LoanDetailView.SCHEDULE &&
          schedule.status === LoanReadStatus.OK ? (
            <LoanSchedulePanel
              title={t("scheduleTitle")}
              emptyLabel={t("scheduleEmpty")}
              entries={relevantSchedule(scheduleList)}
              formatMoney={money}
              t={t}
              today={today}
            />
          ) : null}
          {view === LoanDetailView.SCHEDULE &&
          schedule.status === LoanReadStatus.OK ? (
            <>
              <Text size="sm" tone="secondary">
                {t("scheduleWindowHint")}
              </Text>
              <Link
                href={`${moneyLoanPath(id)}/schedule`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent"
              >
                {t("viewFullSchedule")}
              </Link>
            </>
          ) : null}

          {view === LoanDetailView.HISTORY &&
          payments.status === LoanReadStatus.ERROR ? (
            <ErrorState
              title={t("historyError")}
              action={
                <Link
                  href={moneyLoanPath(id)}
                  className="text-sm font-medium text-accent"
                >
                  {t("retry")}
                </Link>
              }
            />
          ) : null}
          {view === LoanDetailView.HISTORY &&
          payments.status === LoanReadStatus.OK ? (
            <LoanPaymentHistoryPanel
              title={t("historyTitle")}
              payments={payments.payments}
              accountNames={
                new Map(
                  localizedAccounts.map((account) => [
                    account.id,
                    account.name,
                  ]),
                )
              }
              formatMoney={money}
              t={t}
            />
          ) : null}

          {view === LoanDetailView.HISTORY &&
          ratePeriods.status === LoanReadStatus.ERROR ? (
            <ErrorState
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
          ) : null}
          {view === LoanDetailView.HISTORY &&
          ratePeriods.status === LoanReadStatus.OK ? (
            <LoanRateHistoryPanel
              title={t("rateHistoryTitle")}
              emptyLabel={t("rateHistoryEmpty")}
              periods={ratePeriods.periods}
              openLabel={t("rateHistoryOpen")}
              kindLabel={(kind) =>
                tLoans(`ratePeriodKinds.${kind}` as "ratePeriodKinds.fixed")
              }
              t={t}
            />
          ) : null}

          {view === LoanDetailView.HISTORY && isActive && canMutate ? (
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="loan-secondary-actions"
            >
              <Text size="sm" className="font-medium">
                {t("secondaryActions")}
              </Text>
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
            </section>
          ) : null}

          <Link
            href={APP_PATH.MONEY_LOANS}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

function LoanFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="break-words text-sm font-medium text-text-primary">
        {value}
      </dd>
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

function resolveLoanDetailView(value: string | undefined): LoanDetailView {
  if (value === LoanDetailView.SCHEDULE) return LoanDetailView.SCHEDULE;
  if (value === LoanDetailView.HISTORY) return LoanDetailView.HISTORY;
  return LoanDetailView.OVERVIEW;
}

function dueStateClass(state: LoanDueState): string {
  if (state === LoanDueState.OVERDUE) return "font-semibold text-danger";
  if (state === LoanDueState.DUE_TODAY) return "font-semibold text-warning";
  if (state === LoanDueState.DUE_SOON) return "font-medium text-info";
  return "text-text-secondary";
}

function LoanReadError({
  title,
  retryLabel,
  retryHref,
}: {
  title: string;
  retryLabel: string;
  retryHref: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <ErrorState
        title={title}
        action={
          <Link href={retryHref} className="text-sm font-medium text-accent">
            {retryLabel}
          </Link>
        }
      />
    </div>
  );
}
