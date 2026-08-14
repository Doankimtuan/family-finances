import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import {
  DebtDirection,
  DebtStatus,
  getDebt,
  getDebtDueInfo,
  getDebtProgress,
  listAccounts,
  listDebtPayments,
} from "@/modules/ledger/application";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  formatCurrency,
  formatDate as formatLocalizedDate,
} from "@/shared/i18n/formatters";
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { DebtDueBadge, DebtProgressSummary } from "../debt-presentation";
import { DebtPaymentHistory } from "./debt-payment-history";
import { DebtPaymentSheet } from "./debt-payment-sheet";

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
  const [t, tDebts, debt, accountsResult, paymentsResult] = await Promise.all([
    getTranslations("money.debtDetail"),
    getTranslations("money.debtsPage"),
    getDebt(id),
    listAccounts(),
    listDebtPayments(id),
  ]);
  if (!debt) {
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
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }
  const today = todayIsoDate();
  const isBorrowed = debt.direction === DebtDirection.BORROWED;
  const progress = getDebtProgress(debt);
  const due = getDebtDueInfo(debt, today);
  const payments = paymentsResult ?? [];
  const accounts = (accountsResult?.accounts ?? []).map((account) => ({
    id: account.id,
    name: account.name,
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
    paid: (amount: string, percent: number) =>
      tDebts("paidProgress", { amount, percent }),
    received: (amount: string, percent: number) =>
      tDebts("receivedProgress", { amount, percent }),
    noPayment: isBorrowed ? t("noRepayments") : t("noReceipts"),
    completed: t("paidOff"),
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
          <div className="flex items-center justify-between gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
            <Text size="sm" tone="secondary">
              {tDebts("amountLabel")}
            </Text>
            <Text
              size="sm"
              weight="medium"
              className="tabular-nums text-text-primary"
            >
              {formatCurrency(debt.principalAmount, debt.currency, locale, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </div>
        </Card>
        {debt.status === DebtStatus.ACTIVE ? (
          <DebtPaymentSheet
            debtId={debt.id}
            direction={debt.direction}
            remainingAmount={debt.remainingAmount}
            currency={debt.currency}
            locale={locale}
            accounts={accounts}
            today={today}
          />
        ) : (
          <Text size="sm" tone="secondary">
            {t("paidOff")}
          </Text>
        )}
        <DebtPaymentHistory
          title={t("history")}
          countLabel={t("historyCount", { count: payments.length })}
          emptyTitle={
            debt.status === DebtStatus.COMPLETED
              ? t("paidOff")
              : isBorrowed
                ? t("noRepayments")
                : t("noReceipts")
          }
          accountFallback={t("historyAccountFallback")}
          isBorrowed={isBorrowed}
          payments={payments}
          formatAmount={(amount) =>
            formatCurrency(amount, debt.currency, locale, {
              maximumFractionDigits: 0,
            })
          }
          formatDate={(isoDate) =>
            formatLocalizedDate(new Date(`${isoDate}T00:00:00Z`), locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          }
        />
      </div>
    </div>
  );
}
