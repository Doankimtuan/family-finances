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
  computeEarlyPayoffAmount,
} from "@/modules/ledger/application";
import {
  AccountType,
  LoanInterestStrategy,
  LoanScheduleEntryStatus,
  LoanStatus,
} from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { LoanPayAction } from "./loan-pay-action";
import { LoanEditAction } from "./loan-edit-action";
import { LoanEditInterestAction } from "./loan-edit-interest-action";
import { LoanCloseAction } from "./loan-close-action";

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

  const upcoming = (schedule ?? []).filter(
    (entry) =>
      entry.status === LoanScheduleEntryStatus.UPCOMING ||
      entry.status === LoanScheduleEntryStatus.PARTIAL,
  );
  const nextEntry = upcoming[0] ?? null;
  const upcomingInterest = upcoming.reduce(
    (sum, entry) => sum + entry.interestDue,
    0,
  );
  const earlyPayoff = computeEarlyPayoffAmount(
    loan.remainingPrincipal,
    upcomingInterest,
  );
  const isActive = loan.status === LoanStatus.ACTIVE;
  const today = new Date().toISOString().slice(0, 10);
  const canEditInterest =
    isActive &&
    (loan.interestStrategy === LoanInterestStrategy.FLOATING ||
      (loan.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING &&
        (!loan.promoRateEffectiveOn || today >= loan.promoRateEffectiveOn)));

  const money = (n: number) =>
    formatCurrency(n, loan.currency, locale, { maximumFractionDigits: 0 });

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
            <Amount
              label={t("remainingLabel")}
              amountLabel={money(loan.remainingPrincipal)}
              size="lg"
            />
            <Text size="sm" tone="secondary">
              {tLoans("progress", { percent: Math.round(loan.progress * 100) })}
            </Text>
            {loan.nextPaymentDate ? (
              <Text size="sm" tone="secondary">
                {t("nextPaymentLabel", { date: loan.nextPaymentDate })}
              </Text>
            ) : null}
            <Text size="sm" tone="secondary">
              {t("monthlyPaymentLabel", { amount: money(loan.monthlyPayment) })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("principalPaidLabel", { amount: money(loan.principalPaid) })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("interestPaidLabel", { amount: money(loan.interestPaid) })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("totalInterestLabel", { amount: money(loan.totalInterest) })}
            </Text>
            {loan.expectedEndDate ? (
              <Text size="sm" tone="secondary">
                {t("endDateLabel", { date: loan.expectedEndDate })}
              </Text>
            ) : null}
            <Text size="sm" tone="secondary">
              {tLoans(`repaymentMethods.${loan.repaymentMethod}`)}
            </Text>
            <Text size="sm" tone="secondary">
              {tLoans(`interestStrategies.${loan.interestStrategy}`)}
            </Text>
            {loan.annualInterestRate != null ? (
              <Text size="sm" tone="secondary">
                {t("currentRateLabel", {
                  rate: String(loan.annualInterestRate),
                })}
              </Text>
            ) : null}
            {loan.promoRateEffectiveOn ? (
              <Text size="sm" tone="secondary">
                {t("promoSwitchLabel", { date: loan.promoRateEffectiveOn })}
              </Text>
            ) : null}
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
          ) : isActive ? (
            <>
              <Text size="sm" tone="secondary">
                {t("completeHint")}
              </Text>
              <LoanPayAction
                loanId={loan.id}
                scheduledAmountLabel={money(
                  nextEntry?.totalDue ?? loan.monthlyPayment,
                )}
                earlyPayoffAmountLabel={money(earlyPayoff)}
                accounts={liquidAccounts.map((a) => ({
                  id: a.id,
                  name: a.name,
                }))}
              />
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
                  defaultEffectiveFrom={loan.nextPaymentDate ?? today}
                />
              ) : null}
              <LoanCloseAction loanId={loan.id} />
            </>
          ) : (
            <Text size="sm" tone="secondary">
              {tLoans(`status.${loan.status}`)}
            </Text>
          )}

          {(ratePeriods ?? []).length > 0 ? (
            <section
              className="flex flex-col gap-(--space-2)"
              data-testid="loan-rate-history"
            >
              <Text size="sm" className="font-medium">
                {t("rateHistoryTitle")}
              </Text>
              <ul className="flex flex-col gap-(--space-2)">
                {(ratePeriods ?? []).map((period) => (
                  <li
                    key={period.id}
                    className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
                    data-testid={`loan-rate-period-${period.sequence}`}
                  >
                    <Text size="sm">
                      {t("rateHistoryRow", {
                        rate: String(period.annualRate),
                        from: period.effectiveFrom,
                        to: period.effectiveTo ?? t("rateHistoryOpen"),
                        kind: tLoans(`ratePeriodKinds.${period.kind}`),
                      })}
                    </Text>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            id="loan-schedule"
            className="flex flex-col gap-(--space-2)"
            data-testid="loan-schedule"
          >
            <Text size="sm" className="font-medium">
              {t("scheduleTitle")}
            </Text>
            {(schedule ?? []).length === 0 ? (
              <Text size="sm" tone="secondary">
                {t("scheduleEmpty")}
              </Text>
            ) : (
              <ul className="flex flex-col gap-(--space-2)">
                {(schedule ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
                    data-testid={`loan-schedule-${entry.sequence}`}
                  >
                    <div className="flex justify-between gap-(--space-2)">
                      <Text size="sm">
                        {t("scheduleMonth", {
                          month: entry.sequence,
                          date: entry.dueDate,
                        })}
                      </Text>
                      <Text size="sm" className="tabular-nums font-medium">
                        {money(entry.totalDue)}
                      </Text>
                    </div>
                    <Text size="sm" tone="secondary">
                      {t("scheduleSplit", {
                        principal: money(entry.principalDue),
                        interest: money(entry.interestDue),
                        remaining: money(entry.remainingBalanceAfter),
                      })}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {t(`scheduleStatus.${entry.status}`)}
                    </Text>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(payments ?? []).length > 0 ? (
            <section className="flex flex-col gap-(--space-2)">
              <Text size="sm" className="font-medium">
                {t("historyTitle")}
              </Text>
              <ul className="flex flex-col gap-(--space-2)">
                {(payments ?? []).map((payment) => (
                  <li
                    key={payment.id}
                    className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
                    data-testid={`loan-payment-${payment.id}`}
                  >
                    <div className="flex justify-between gap-(--space-2)">
                      <Text size="sm">{payment.paidAt}</Text>
                      <Text size="sm" className="tabular-nums font-medium">
                        {money(payment.amount)}
                      </Text>
                    </div>
                    <Text size="sm" tone="secondary">
                      {t("historySplit", {
                        principal: money(payment.principalPaid),
                        interest: money(payment.interestPaid),
                      })}
                    </Text>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Link
            href={APP_PATH.MONEY_LOANS}
            className="text-sm font-medium text-accent"
            data-testid="loan-detail-back"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
