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
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { LoanCard } from "@/modules/ledger/ui/loan-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { CreateLoanForm } from "./create-loan-form";

type Props = { params: Promise<{ locale: string }> };

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

  const [t, tProducts, loans, messages] = await Promise.all([
    getTranslations("money.loansPage"),
    getTranslations("money.products"),
    listLoans(),
    getMessages(),
  ]);

  const loadFailed = loans == null;
  const list = loans ?? [];
  const today = todayIsoDate();
  const activeLoans = list.filter((loan) => loan.status === LoanStatus.ACTIVE);
  const historyLoans = list.filter((loan) => loan.status !== LoanStatus.ACTIVE);

  const renderLoan = (loan: (typeof list)[number]) => {
    const dueState = getLoanDueState(loan.nextPaymentDate, today);
    const dueLabel = loan.nextPaymentDate
      ? t(`dueStates.${dueState}`, { date: loan.nextPaymentDate })
      : undefined;
    const nextAmount = loan.nextPaymentAmount;
    const monthlyLabel = t("nextPaymentLabel");
    return (
      <li key={loan.id}>
        <Link
          href={moneyLoanPath(loan.id)}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <LoanCard
            title={loan.name}
            subtitle={
              loan.lender
                ? `${loan.lender} · ${t(`loanTypes.${loan.loanType}`)}`
                : t(`loanTypes.${loan.loanType}`)
            }
            remainingLabel={t("remainingPrincipalLabel")}
            remainingAmount={
              <FinancialValue>
                {formatCurrency(
                  loan.remainingPrincipal,
                  loan.currency,
                  locale,
                  {
                    maximumFractionDigits: 0,
                  },
                )}
              </FinancialValue>
            }
            monthlyLabel={monthlyLabel}
            monthlyAmount={formatCurrency(
              loan.monthlyPayment,
              loan.currency,
              locale,
              { maximumFractionDigits: 0 },
            )}
            nextDueLabel={
              dueLabel ? (
                <span
                  className={
                    dueState === LoanDueState.OVERDUE
                      ? "font-semibold text-danger"
                      : undefined
                  }
                >
                  {dueLabel}
                  {nextAmount != null ? (
                    <>
                      {" "}
                      ·{" "}
                      <FinancialValue>
                        {formatCurrency(nextAmount, loan.currency, locale, {
                          maximumFractionDigits: 0,
                        })}
                      </FinancialValue>
                    </>
                  ) : null}
                </span>
              ) : undefined
            }
            progressLabel={t("progress", {
              percent: Math.round(loan.progress * 100),
            })}
            interestLabel={
              loan.annualInterestRate != null && loan.annualInterestRate > 0
                ? t("interestRate", { rate: String(loan.annualInterestRate) })
                : t("interestFree")
            }
            statusLabel={t(`status.${loan.status}`)}
            status={loan.status}
            data-testid={`loan-row-${loan.id}`}
          />
        </Link>
      </li>
    );
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-full flex-col" data-testid="money-loans">
        <TopAppBar title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <Text size="sm" tone="secondary">
            {t("trackingOnly")}
          </Text>
          {loadFailed ? (
            <StatusAlert
              variant="danger"
              title={t("loadErrorTitle")}
              description={tProducts("errors.unknown")}
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
            />
          ) : (
            <div
              className="flex flex-col gap-(--space-4)"
              data-testid="loans-list"
            >
              {activeLoans.length > 0 ? (
                <section aria-labelledby="loans-active-heading">
                  <Text id="loans-active-heading" weight="semibold">
                    {t("activeSection")}
                  </Text>
                  <ul className="mt-(--space-2) flex flex-col gap-(--space-2)">
                    {activeLoans.map(renderLoan)}
                  </ul>
                </section>
              ) : null}
              {historyLoans.length > 0 ? (
                <section aria-labelledby="loans-history-heading">
                  <Text id="loans-history-heading" weight="semibold">
                    {t("historySection")}
                  </Text>
                  <ul className="mt-(--space-2) flex flex-col gap-(--space-2)">
                    {historyLoans.map(renderLoan)}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
          <CreateLoanForm />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
