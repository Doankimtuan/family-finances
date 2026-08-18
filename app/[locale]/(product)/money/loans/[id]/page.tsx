import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getLoan,
  listLoanPayments,
  listLoanSchedule,
  listLoanInterestRatePeriods,
  listAccounts,
} from "@/modules/ledger/application";
import {
  AccountType,
  LoanInterestStrategy,
  LoanScheduleEntryStatus,
  LoanStatus,
} from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
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

type Props = { params: Promise<{ locale: string; id: string }> };

/** money.loans detail — schedule-driven payments; complete → Inbox. */
export default async function LoanDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
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
    loan,
    payments,
    schedule,
    ratePeriods,
    accountsResult,
    messages,
  ] = await Promise.all([
    getTranslations("money.loanDetail"),
    getTranslations("money.loansPage"),
    getTranslations("money.products"),
    getLoan(id),
    listLoanPayments(id),
    listLoanSchedule(id),
    listLoanInterestRatePeriods(id),
    listAccounts(),
    getMessages(),
  ]);

  if (!loan) {
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

  const liquidAccounts = (accountsResult?.accounts ?? []).filter(
    (account) => account.type !== AccountType.CREDIT_CARD,
  );

  const scheduleList = schedule ?? [];
  const upcoming = scheduleList.filter(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.UPCOMING ||
      entry.status === LoanScheduleEntryStatus.PARTIAL,
  );
  const paid = scheduleList.filter(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.PAID ||
      entry.status === LoanScheduleEntryStatus.WAIVED,
  );
  const orderedSchedule = [...upcoming, ...paid];
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
  const feeDue = 0;

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

          <section
            className="flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
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
            />
            <Text size="sm" tone="secondary">
              {t("recordedPrincipalCaveat")}
            </Text>
            {nextEntry ? (
              <>
                <Text size="sm" className="font-medium">
                  {t("nextDueLead", {
                    amount: money(nextTotal),
                    date: nextEntry.dueDate,
                  })}
                </Text>
                <Text size="sm" tone="secondary">
                  {t("nextDueSplit", {
                    principal: money(nextEntry.principalDue),
                    interest: money(nextEntry.interestDue),
                    fee: money(feeDue),
                  })}
                </Text>
              </>
            ) : loan.nextPaymentDate ? (
              <Text size="sm" tone="secondary">
                {t("nextPaymentLabel", { date: loan.nextPaymentDate })}
              </Text>
            ) : null}
            {loan.annualInterestRate != null ? (
              <Text size="sm" tone="secondary">
                {t("currentRateLabel", {
                  rate: String(loan.annualInterestRate),
                })}
              </Text>
            ) : null}
            <Text size="sm" tone="secondary">
              {tLoans("progress", { percent: Math.round(loan.progress * 100) })}
            </Text>
          </section>

          {loan.status === LoanStatus.COMPLETED ? (
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
          ) : isActive && canMutate ? (
            <>
              {nextEntry ? (
                <LoanPayAction
                  loanId={loan.id}
                  loanName={loan.name}
                  currency={loan.currency}
                  principalDue={nextEntry.principalDue}
                  interestDue={nextEntry.interestDue}
                  feeDue={feeDue}
                  totalDue={nextTotal}
                  remainingPrincipal={loan.remainingPrincipal}
                  accounts={liquidAccounts.map((a) => ({
                    id: a.id,
                    name: a.name,
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
          ) : isActive ? (
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

          <LoanSchedulePanel
            title={t("scheduleTitle")}
            emptyLabel={t("scheduleEmpty")}
            entries={orderedSchedule}
            formatMoney={money}
            t={t}
          />

          <LoanPaymentHistoryPanel
            title={t("historyTitle")}
            payments={payments ?? []}
            formatMoney={money}
            t={t}
          />

          <LoanRateHistoryPanel
            title={t("rateHistoryTitle")}
            periods={ratePeriods ?? []}
            openLabel={t("rateHistoryOpen")}
            kindLabel={(kind) =>
              tLoans(`ratePeriodKinds.${kind}` as "ratePeriodKinds.fixed")
            }
            t={t}
          />

          {isActive && canMutate ? (
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
