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
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { LoanCard } from "@/shared/patterns/loan-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
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

  const [t, tMoney, tProducts, loans, messages] = await Promise.all([
    getTranslations("money.loansPage"),
    getTranslations("money"),
    getTranslations("money.products"),
    listLoans(),
    getMessages(),
  ]);

  const loadFailed = loans == null;
  const list = loans ?? [];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-full flex-col" data-testid="money-loans">
        <TopAppBar title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
          <MoneyOfflineBanner />
          <Text size="sm" tone="secondary">
            {tProducts("notBankBalance")}
          </Text>
          <CreateLoanForm />
          {loadFailed ? (
            <StatusAlert
              variant="danger"
              title={t("emptyTitle")}
              description={tProducts("errors.unknown")}
            />
          ) : list.length === 0 ? (
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col gap-(--space-2)">
              {list.map((loan) => (
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
                      remainingLabel={t("remainingLabel", {
                        amount: formatCurrency(
                          loan.remainingPrincipal,
                          loan.currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        ),
                      })}
                      monthlyLabel={t("monthlyLabel", {
                        amount: formatCurrency(
                          loan.monthlyPayment,
                          loan.currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        ),
                      })}
                      nextDueLabel={
                        loan.nextPaymentDate
                          ? t("nextDueLabel", { date: loan.nextPaymentDate })
                          : undefined
                      }
                      progressLabel={t("progress", {
                        percent: Math.round(loan.progress * 100),
                      })}
                      interestLabel={
                        loan.annualInterestRate != null &&
                        loan.annualInterestRate > 0
                          ? t("interestRate", {
                              rate: String(loan.annualInterestRate),
                            })
                          : t("interestFree")
                      }
                      methodLabel={`${t(
                        `repaymentMethods.${loan.repaymentMethod}`,
                      )} · ${t(`interestStrategies.${loan.interestStrategy}`)}`}
                      statusLabel={t(`status.${loan.status}`)}
                      status={loan.status}
                      data-testid={`loan-row-${loan.id}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={APP_PATH.MONEY}
            className="text-sm font-medium text-accent"
            data-testid="loans-back-money"
          >
            {tMoney("backToMoney")}
          </Link>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
