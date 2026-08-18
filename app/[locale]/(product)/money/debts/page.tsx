import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import {
  buildDebtSummary,
  buildDebtViewModels,
  DebtDirection,
  DebtStatus,
  DEFAULT_CURRENCY,
  listAccounts,
  listDebts,
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyDebtPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency } from "@/shared/i18n/formatters";
import { MotionReveal } from "@/shared/motion";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { DebtCreateSheet } from "./debt-create-sheet";
import { DebtDueBadge, DebtProgressSummary } from "./debt-presentation";

type Props = { params: Promise<{ locale: string }> };

export default async function DebtsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tProducts, debtsResult, accountsResult] = await Promise.all([
    getTranslations("money.debtsPage"),
    getTranslations("money.products"),
    listDebts(),
    listAccounts(),
  ]);
  const today = todayIsoDate();
  const debts = debtsResult ?? [];
  const rows = buildDebtViewModels(debts, today);
  const activeRows = rows.filter((debt) => debt.status === DebtStatus.ACTIVE);
  const historyRows = rows.filter((debt) => debt.status !== DebtStatus.ACTIVE);
  const summary = buildDebtSummary(debts, today);
  const attentionCount = summary.overdueCount + summary.dueSoonCount;
  const currency = accountsResult?.currency ?? DEFAULT_CURRENCY;
  const accounts = (accountsResult?.accounts ?? []).map((account) => ({
    id: account.id,
    name: account.name,
  }));
  const dueLabels = {
    dueDate: (date: string) => t("dueDate", { date }),
    today: t("dueToday"),
    daysLeft: (days: number) => t("daysLeft", { days }),
    daysOverdue: (days: number) => t("daysOverdue", { days }),
    completed: t("completed"),
  };
  const progressLabels = {
    paid: (amount: string, percent: number) =>
      t("paidProgress", { amount, percent }),
    received: (amount: string, percent: number) =>
      t("receivedProgress", { amount, percent }),
    noPayment: t("noPayment"),
    completed: t("completed"),
  };

  return (
    <div className="flex min-h-full flex-col" data-testid="money-debts">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <DebtCreateSheet accounts={accounts} today={today} />
        {debtsResult == null ? (
          <StatusAlert variant="danger" title={tProducts("errors.unknown")} />
        ) : debts.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <>
            <Text size="sm" tone="secondary">
              {attentionCount > 0
                ? t("contextAttention", { count: attentionCount })
                : t("contextCalm")}
            </Text>
            <MotionReveal>
              <section
                className="grid grid-cols-2 divide-x divide-border-subtle rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/45"
                aria-label={t("title")}
              >
                <DebtSummaryMetric
                  icon={FINANCE_ICONS.expense}
                  iconTone="expense"
                  label={t("payable")}
                  amount={formatCurrency(
                    summary.totalBorrowed,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                />
                <DebtSummaryMetric
                  icon={FINANCE_ICONS.income}
                  iconTone="income"
                  label={t("receivable")}
                  amount={formatCurrency(summary.totalLent, currency, locale, {
                    maximumFractionDigits: 0,
                  })}
                />
              </section>
            </MotionReveal>
            {attentionCount > 0 ? (
              <MotionReveal>
                <StatusAlert
                  variant={summary.overdueCount > 0 ? "danger" : "warning"}
                  title={t("attention", { count: attentionCount })}
                />
              </MotionReveal>
            ) : null}
            <MotionReveal>
              <section className="flex flex-col gap-(--space-2)">
                <Text size="sm" className="font-medium text-text-primary">
                  {t("active")}
                </Text>
                <ul className="flex flex-col gap-(--space-2)">
                  {activeRows.map((debt) => {
                    const isBorrowed =
                      debt.direction === DebtDirection.BORROWED;
                    const remainingLabel = isBorrowed
                      ? t("remainingToPay")
                      : t("remainingToReceive");
                    return (
                      <li key={debt.id}>
                        <Link
                          href={moneyDebtPath(debt.id)}
                          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <Card
                            className="gap-(--space-3) p-(--space-3)"
                            data-testid={`debt-row-${debt.id}`}
                          >
                            <div className="flex items-start gap-(--space-3)">
                              <IconContainer
                                tone={isBorrowed ? "debt" : "income"}
                                size="sm"
                              >
                                <AppIcon
                                  icon={
                                    isBorrowed
                                      ? FINANCE_ICONS.debt
                                      : FINANCE_ICONS.income
                                  }
                                  size="sm"
                                />
                              </IconContainer>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-(--space-2)">
                                  <div className="min-w-0">
                                    <Text
                                      size="sm"
                                      weight="medium"
                                      className="truncate text-text-primary"
                                    >
                                      {debt.counterparty}
                                    </Text>
                                    <Text size="sm" tone="secondary">
                                      {isBorrowed
                                        ? t("create.borrowed")
                                        : t("create.lent")}
                                    </Text>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <Text size="sm" tone="secondary">
                                      {remainingLabel}
                                    </Text>
                                    <Text
                                      size="sm"
                                      weight="semibold"
                                      className="tabular-nums text-text-primary"
                                    >
                                      {formatCurrency(
                                        debt.remainingAmount,
                                        debt.currency,
                                        locale,
                                        { maximumFractionDigits: 0 },
                                      )}
                                    </Text>
                                  </div>
                                </div>
                                <div className="mt-(--space-3) flex flex-col gap-(--space-2)">
                                  <DebtDueBadge
                                    due={debt.due}
                                    dueDate={debt.dueDate}
                                    labels={dueLabels}
                                    locale={locale}
                                  />
                                  <DebtProgressSummary
                                    direction={debt.direction}
                                    progress={debt.progress}
                                    currency={debt.currency}
                                    locale={locale}
                                    labels={progressLabels}
                                  />
                                  <FinancialOwnershipBadge
                                    financialScope={
                                      debt.ownership.financialScope
                                    }
                                    isOwnedByMe={debt.ownership.isOwnedByMe}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </MotionReveal>
            {historyRows.length > 0 ? (
              <MotionReveal>
                <section className="flex flex-col gap-(--space-2)">
                  <Text size="sm" className="font-medium text-text-primary">
                    {t("history")}
                  </Text>
                  <div className="flex flex-col divide-y divide-border-subtle">
                    {historyRows.map((debt) => (
                      <Link
                        key={debt.id}
                        href={moneyDebtPath(debt.id)}
                        className="flex min-h-11 items-center justify-between py-(--space-2) text-sm text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <span>{debt.counterparty}</span>
                        <span className="tabular-nums">
                          {formatCurrency(
                            debt.principalAmount,
                            debt.currency,
                            locale,
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              </MotionReveal>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function DebtSummaryMetric({
  icon,
  iconTone,
  label,
  amount,
}: {
  icon: typeof FINANCE_ICONS.income;
  iconTone: "expense" | "income";
  label: string;
  amount: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-(--space-2) p-(--space-3)">
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text
        size="sm"
        weight="semibold"
        className="truncate tabular-nums text-text-primary"
      >
        {amount}
      </Text>
    </div>
  );
}
