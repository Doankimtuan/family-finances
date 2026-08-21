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
  isDebtMovementAccountType,
  listAccounts,
  listDebts,
} from "@/modules/ledger/application";
import {
  APP_PATH,
  moneyDebtPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { MotionReveal } from "@/shared/motion";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FinancialValue } from "@/shared/patterns/financial-value";
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

  const [t, tCatalog, debtsResult, accountsResult] = await Promise.all([
    getTranslations("money.debtsPage"),
    getTranslations("catalog"),
    listDebts(),
    listAccounts(),
  ]);
  const today = todayIsoDate();
  const debts = debtsResult ?? [];
  const rows = buildDebtViewModels(debts, today);
  const activeRows = rows.filter((debt) => debt.status === DebtStatus.ACTIVE);
  const historyRows = rows.filter((debt) => debt.status !== DebtStatus.ACTIVE);
  const summary = buildDebtSummary(debts, today);
  const nextDue = activeRows.find((debt) => debt.dueDate !== null);
  const currency = accountsResult?.currency ?? DEFAULT_CURRENCY;
  const accounts = (accountsResult?.accounts ?? [])
    .filter((account) => isDebtMovementAccountType(account.type))
    .map((account) => ({
      id: account.id,
      name: localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, account.name),
      type: account.type,
      balance: account.balance,
    }));
  const dueLabels = {
    dueDate: (date: string) => t("dueDate", { date }),
    today: t("dueToday"),
    daysLeft: (days: number) => t("daysLeft", { days }),
    daysOverdue: (days: number) => t("daysOverdue", { days }),
    completed: t("completed"),
  };
  const progressLabels = {
    paid: t("paid"),
    received: t("received"),
  };
  const createSheet = (
    <DebtCreateSheet
      accounts={accounts}
      accountsLoadFailed={accountsResult == null}
      currency={currency}
      locale={locale}
      today={today}
    />
  );

  return (
    <div className="flex min-h-full flex-col" data-testid="money-debts">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner
          title={t("offlineTitle")}
          description={t("offlineDescription")}
        />
        {debtsResult == null ? (
          <>
            {createSheet}
            <StatusAlert
              variant="danger"
              title={t("loadErrorTitle")}
              description={t("loadErrorDescription")}
              action={
                <Link
                  href={APP_PATH.MONEY_DEBTS}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid="debt-retry"
                >
                  {t("retry")}
                </Link>
              }
            />
          </>
        ) : debts.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={createSheet}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <>
            {createSheet}
            <MotionReveal>
              <Card
                tone="metric"
                className="gap-(--space-4) p-(--space-4)"
                aria-label={t("title")}
              >
                <Text size="sm" weight="semibold">
                  {t("overview")}
                </Text>
                <div className="grid grid-cols-2 divide-x divide-border-subtle">
                  <DebtSummaryMetric
                    icon={FINANCE_ICONS.expense}
                    iconTone="expense"
                    label={t("payable")}
                    amountClassName="text-debt"
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
                    amountClassName="text-income"
                    amount={formatCurrency(
                      summary.totalLent,
                      currency,
                      locale,
                      {
                        maximumFractionDigits: 0,
                      },
                    )}
                  />
                </div>
                {summary.overdueCount > 0 || summary.dueSoonCount > 0 ? (
                  <div className="flex flex-wrap gap-x-(--space-4) gap-y-(--space-2) border-t border-border-subtle pt-(--space-3)">
                    {summary.overdueCount > 0 ? (
                      <DebtSummaryStat
                        label={t("overdueCount", {
                          count: summary.overdueCount,
                        })}
                        tone="danger"
                      />
                    ) : null}
                    {summary.dueSoonCount > 0 ? (
                      <DebtSummaryStat
                        label={t("dueSoonCount", {
                          count: summary.dueSoonCount,
                        })}
                        tone="accent"
                      />
                    ) : null}
                  </div>
                ) : null}
                {nextDue?.dueDate ? (
                  <Text size="sm" tone="secondary">
                    {t("nextDue", {
                      counterparty: nextDue.counterparty,
                      date: formatDate(
                        new Date(`${nextDue.dueDate}T00:00:00Z`),
                        locale,
                        { day: "2-digit", month: "short", year: "numeric" },
                      ),
                    })}
                  </Text>
                ) : null}
              </Card>
            </MotionReveal>
            <MotionReveal>
              <section className="flex flex-col gap-(--space-2)">
                <Text size="sm" className="font-medium text-text-primary">
                  {t("active")}
                </Text>
                {activeRows.length === 0 ? (
                  <EmptyState
                    title={t("activeEmptyTitle")}
                    description={t("activeEmptyDescription")}
                    className="flex-none rounded-[var(--radius-card)] border border-border-subtle py-(--space-4)"
                  />
                ) : (
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
                              tone="interactive"
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
                                    <div className="flex min-w-0 flex-wrap items-center gap-x-(--space-2) gap-y-1">
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
                                      <FinancialOwnershipBadge
                                        financialScope={
                                          debt.ownership.financialScope
                                        }
                                        isOwnedByMe={debt.ownership.isOwnedByMe}
                                        ownerStatus={debt.ownership.ownerStatus}
                                      />
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <Text size="sm" tone="secondary">
                                        {remainingLabel}
                                      </Text>
                                      <Text
                                        size="lg"
                                        weight="semibold"
                                        className={`tabular-nums ${isBorrowed ? "text-debt" : "text-income"}`}
                                      >
                                        <FinancialValue>
                                          {formatCurrency(
                                            debt.remainingAmount,
                                            debt.currency,
                                            locale,
                                            { maximumFractionDigits: 0 },
                                          )}
                                        </FinancialValue>
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
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </MotionReveal>
            {historyRows.length > 0 ? (
              <MotionReveal>
                <section className="flex flex-col gap-(--space-2)">
                  <Text size="sm" className="font-medium text-text-primary">
                    {t("history")}
                  </Text>
                  <ul className="flex flex-col gap-(--space-2)">
                    {historyRows.map((debt) => (
                      <li key={debt.id}>
                        <Link
                          href={moneyDebtPath(debt.id)}
                          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <Card
                            tone="interactive"
                            className="flex-row items-center justify-between gap-(--space-3) p-(--space-3)"
                            data-testid={`debt-history-row-${debt.id}`}
                          >
                            <div className="min-w-0">
                              <Text
                                size="sm"
                                weight="medium"
                                className="truncate"
                              >
                                {debt.counterparty}
                              </Text>
                              <Text size="sm" tone="secondary">
                                {debt.direction === DebtDirection.BORROWED
                                  ? t("create.borrowed")
                                  : t("create.lent")}
                              </Text>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-(--space-1)">
                              <DebtDueBadge
                                due={debt.due}
                                dueDate={debt.dueDate}
                                labels={dueLabels}
                                locale={locale}
                              />
                              <Text
                                size="sm"
                                weight="semibold"
                                className="tabular-nums"
                              >
                                <FinancialValue>
                                  {formatCurrency(
                                    debt.principalAmount,
                                    debt.currency,
                                    locale,
                                    { maximumFractionDigits: 0 },
                                  )}
                                </FinancialValue>
                              </Text>
                            </div>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
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
  amountClassName,
}: {
  icon: typeof FINANCE_ICONS.income;
  iconTone: "expense" | "income";
  label: string;
  amount: string;
  amountClassName: string;
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
        size="lg"
        weight="semibold"
        className={`truncate tabular-nums ${amountClassName}`}
      >
        <FinancialValue>{amount}</FinancialValue>
      </Text>
    </div>
  );
}

function DebtSummaryStat({
  label,
  tone,
}: {
  label: string;
  tone: "accent" | "danger" | "secondary";
}) {
  return (
    <Text size="sm" tone={tone} weight="medium">
      {label}
    </Text>
  );
}
