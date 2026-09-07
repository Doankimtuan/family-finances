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
import { listLoans } from "@/modules/ledger/application";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import {
  LoanDueState,
  LoanStatus,
} from "@/modules/ledger/application/loan-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Card } from "@/shared/patterns/card";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { CreateLoanForm, LoanCreateTrigger } from "./create-loan-form";
import { LoanPrivacyToggle } from "./loan-privacy-toggle";
import { LoanProductRow } from "./loan-product-row";
import { LoanSectionTitle } from "./loan-section-title";

type Props = { params: Promise<{ locale: string }> };

function moneyLabel(value: number, currency: string, locale: string) {
  return formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
}

function SummaryMetric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

/** money.loans — Loan / Installment list. */
export default async function LoansPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, loans, messages] = await Promise.all([
    getTranslations("money.loansPage"),
    listLoans(),
    getMessages(),
  ]);

  const loadFailed = loans == null;
  const list = loans ?? [];
  const today = todayIsoDate();
  const activeLoans = list.filter((loan) => loan.status === LoanStatus.ACTIVE);
  const historyLoans = list.filter((loan) => loan.status !== LoanStatus.ACTIVE);
  const totalRemainingPrincipal = activeLoans.reduce(
    (total, loan) => total + loan.remainingPrincipal,
    0,
  );
  const nextPaymentTotal = activeLoans.reduce(
    (total, loan) => total + (loan.nextPaymentAmount ?? 0),
    0,
  );
  const overdueLoanCount = activeLoans.filter(
    (loan) =>
      getLoanDueState(loan.nextPaymentDate, today) === LoanDueState.OVERDUE,
  ).length;
  const summaryCurrency = activeLoans[0]?.currency ?? "";

  const renderLoan = (loan: (typeof list)[number], history = false) => {
    const dueState = getLoanDueState(loan.nextPaymentDate, today);
    const dueLabel = loan.nextPaymentDate
      ? t(`dueStates.${dueState}`, { date: loan.nextPaymentDate })
      : undefined;
    const typeLabel = t(`loanTypes.${loan.loanType}`);
    return (
      <li key={loan.id}>
        <LoanProductRow
          href={moneyLoanPath(loan.id)}
          testId={`loan-row-${loan.id}`}
          loanType={loan.loanType}
          typeLabel={typeLabel}
          title={loan.name}
          subtitle={loan.lender ? `${loan.lender} · ${typeLabel}` : typeLabel}
          remainingAmount={moneyLabel(
            loan.remainingPrincipal,
            loan.currency,
            locale,
          )}
          monthlyLabel={t("nextPaymentLabel")}
          monthlyAmount={moneyLabel(loan.monthlyPayment, loan.currency, locale)}
          interestLabel={
            loan.annualInterestRate != null && loan.annualInterestRate > 0
              ? t("interestRate", { rate: String(loan.annualInterestRate) })
              : t("interestFree")
          }
          dueState={dueState}
          dueLabel={dueLabel}
          nextDueAmount={
            loan.nextPaymentAmount != null
              ? moneyLabel(loan.nextPaymentAmount, loan.currency, locale)
              : undefined
          }
          progressLabel={t("progress", {
            percent: Math.round(loan.progress * 100),
          })}
          progressValue={loan.progress}
          progressAriaLabel={t("progress", {
            percent: Math.round(loan.progress * 100),
          })}
          status={loan.status}
          statusLabel={t(`status.${loan.status}`)}
          ownership={loan.ownership}
          history={history}
        />
      </li>
    );
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Page
        testId="money-loans"
        contentClassName="gap-(--space-5)"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("title")}
            subtitle={t("subtitle")}
            backHref={APP_PATH.MONEY}
          />
        }
      >
        <MoneyOfflineBanner />
        {loadFailed ? (
          <ErrorState
            title={t("loadErrorTitle")}
            description={t("loadErrorDescription")}
            className="flex-none py-(--space-4)"
            action={
              <Link
                href={APP_PATH.MONEY_LOANS}
                className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="loans-retry"
              >
                {t("retry")}
              </Link>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
            icon={
              <AppIcon icon={FINANCE_ICONS.loan} size={AppIconSize.DISPLAY} />
            }
            action={<CreateLoanForm trigger={LoanCreateTrigger.EMPTY} />}
          />
        ) : (
          <div
            className="flex flex-col gap-(--space-5)"
            data-testid="loans-list"
          >
            <MotionReveal>
              <section
                className="flex flex-col gap-(--space-3)"
                data-testid="loans-summary"
              >
                <Card tone="hero" className="gap-0 p-(--space-4)">
                  <div className="flex items-center justify-between gap-(--space-3)">
                    <Text size="sm" weight="medium" className="text-hero-muted">
                      {t("summary.remainingPrincipal")}
                    </Text>
                    <LoanPrivacyToggle testId="loans-financial-privacy-toggle" />
                  </div>
                  <Amount
                    amountLabel={moneyLabel(
                      totalRemainingPrincipal,
                      summaryCurrency,
                      locale,
                    )}
                    size={AmountSize.HERO}
                    className="mt-(--space-2)"
                    amountClassName="text-4xl leading-none text-hero-fg"
                  />
                  <Text
                    size="xs"
                    className="mt-(--space-2) text-pretty text-hero-muted"
                  >
                    {t("trackingOnly")}
                  </Text>
                  <div className="mt-(--space-4) border-t border-white/15 pt-(--space-3)">
                    <Text size="xs" className="text-pretty text-hero-muted">
                      {overdueLoanCount > 0
                        ? t("summary.overdueLoans", { count: overdueLoanCount })
                        : t("summaryCaption")}
                    </Text>
                  </div>
                </Card>
                <Card
                  tone="elevated"
                  className="gap-0 p-(--space-4)"
                  data-testid="loans-summary-metrics"
                >
                  <LoanSectionTitle>{t("summaryTitle")}</LoanSectionTitle>
                  <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
                    <SummaryMetric label={t("summary.activeLoans")}>
                      <Text size="sm" weight="semibold" tabular>
                        {String(activeLoans.length)}
                      </Text>
                    </SummaryMetric>
                    <SummaryMetric label={t("summary.nextPayments")}>
                      <Text size="sm" weight="semibold" tabular>
                        <FinancialValue>
                          {moneyLabel(
                            nextPaymentTotal,
                            summaryCurrency,
                            locale,
                          )}
                        </FinancialValue>
                      </Text>
                    </SummaryMetric>
                    <SummaryMetric label={t("summary.overdueLabel")}>
                      {overdueLoanCount > 0 ? (
                        <StatusBadge tone={StatusBadgeTone.ATTENTION}>
                          {t("summary.overdueLoans", {
                            count: overdueLoanCount,
                          })}
                        </StatusBadge>
                      ) : (
                        <Text size="sm" weight="medium">
                          {t("summary.overdueLoans", {
                            count: overdueLoanCount,
                          })}
                        </Text>
                      )}
                    </SummaryMetric>
                  </div>
                </Card>
              </section>
            </MotionReveal>
            {activeLoans.length > 0 ? (
              <section
                className="flex flex-col gap-(--space-2)"
                aria-labelledby="loans-active-heading"
              >
                <div className="flex items-end justify-between gap-(--space-3)">
                  <div className="min-w-0">
                    <LoanSectionTitle>
                      <span id="loans-active-heading">
                        {t("activeSection")}
                      </span>
                    </LoanSectionTitle>
                    <Text
                      size="xs"
                      tone="secondary"
                      className="mt-(--space-1) text-pretty"
                    >
                      {t("activeHint")}
                    </Text>
                  </div>
                  <Text
                    size="xs"
                    tone="muted"
                    className="shrink-0 tabular-nums"
                  >
                    {t("sectionCount", { count: activeLoans.length })}
                  </Text>
                </div>
                <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                  <ul className="divide-y divide-divider">
                    {activeLoans.map((loan) => renderLoan(loan))}
                  </ul>
                </Card>
              </section>
            ) : null}
            {historyLoans.length > 0 ? (
              <section
                className="flex flex-col gap-(--space-2)"
                aria-labelledby="loans-history-heading"
                data-testid="loans-history-section"
              >
                <div>
                  <LoanSectionTitle>
                    <span id="loans-history-heading">
                      {t("historySection")}
                    </span>
                  </LoanSectionTitle>
                  <Text
                    size="xs"
                    tone="secondary"
                    className="mt-(--space-1) text-pretty"
                  >
                    {t("historyCaption")}
                  </Text>
                </div>
                <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                  <ul className="divide-y divide-divider">
                    {historyLoans.map((loan) => renderLoan(loan, true))}
                  </ul>
                </Card>
              </section>
            ) : null}
            <CreateLoanForm trigger={LoanCreateTrigger.FLOATING} />
          </div>
        )}
      </Page>
    </NextIntlClientProvider>
  );
}
