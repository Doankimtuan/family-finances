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
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { DebtCreateSheet, DebtCreateTrigger } from "./debt-create-sheet";
import { DebtGroupEmpty, DebtProductRow } from "./debt-product-row";
import { DebtPrivacyToggle } from "./debt-privacy-toggle";
import { DebtSectionTitle } from "./debt-section-title";

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

  const [t, tCatalog, tProducts, debtsResult, accountsResult] =
    await Promise.all([
      getTranslations("money.debtsPage"),
      getTranslations("catalog"),
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
  const createAccounts = {
    accounts,
    accountsLoadFailed: accountsResult == null,
    currency,
    locale,
    today,
  };
  const nextDueLabel = nextDue?.dueDate
    ? t("nextDue", {
        counterparty: nextDue.counterparty,
        date: formatDate(new Date(`${nextDue.dueDate}T00:00:00Z`), locale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      })
    : null;
  const heroCaption =
    summary.overdueCount > 0
      ? t("overdueCount", { count: summary.overdueCount })
      : (nextDueLabel ?? t("summaryCaption"));

  return (
    <Page
      testId="money-debts"
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
      <MoneyOfflineBanner
        title={t("offlineTitle")}
        description={t("offlineDescription")}
      />
      {debtsResult == null ? (
        <ErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          className="flex-none py-(--space-4)"
          action={
            <Link
              href={APP_PATH.MONEY_DEBTS}
              className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="debt-retry"
            >
              {t("retry")}
            </Link>
          }
        />
      ) : debts.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="flex-none py-(--space-4)"
          icon={
            <AppIcon icon={FINANCE_ICONS.debt} size={AppIconSize.DISPLAY} />
          }
          action={
            <DebtCreateSheet
              {...createAccounts}
              trigger={DebtCreateTrigger.EMPTY}
            />
          }
        />
      ) : (
        <div
          className="flex flex-col gap-(--space-5)"
          data-testid="debts-list-content"
        >
          <MotionReveal>
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="debts-summary"
            >
              <Card tone="hero" className="gap-0 p-(--space-4)">
                <div className="flex items-center justify-between gap-(--space-3)">
                  <Text size="sm" weight="medium" className="text-hero-muted">
                    {t("payable")}
                  </Text>
                  <DebtPrivacyToggle testId="debts-financial-privacy-toggle" />
                </div>
                <Amount
                  amountLabel={moneyLabel(
                    summary.totalBorrowed,
                    currency,
                    locale,
                  )}
                  size={AmountSize.HERO}
                  className="mt-(--space-2)"
                  amountClassName="text-hero-fg"
                />
                <Text
                  size="xs"
                  className="mt-(--space-2) text-pretty text-hero-muted"
                >
                  {tProducts("notBankBalance")}
                </Text>
                <div className="mt-(--space-4) border-t border-white/15 pt-(--space-3)">
                  <Text size="xs" className="text-pretty text-hero-muted">
                    {heroCaption}
                  </Text>
                </div>
              </Card>
              <Card
                tone="elevated"
                className="gap-0 p-(--space-4)"
                data-testid="debts-summary-metrics"
              >
                <DebtSectionTitle>{t("summaryTitle")}</DebtSectionTitle>
                <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
                  <SummaryMetric label={t("receivable")}>
                    <Text size="sm" weight="semibold" tabular>
                      <FinancialValue>
                        {moneyLabel(summary.totalLent, currency, locale)}
                      </FinancialValue>
                    </Text>
                  </SummaryMetric>
                  <SummaryMetric label={t("active")}>
                    <Text size="sm" weight="semibold" tabular>
                      {String(activeRows.length)}
                    </Text>
                  </SummaryMetric>
                  <SummaryMetric label={t("overdueLabel")}>
                    {summary.overdueCount > 0 ? (
                      <StatusBadge tone={StatusBadgeTone.ATTENTION}>
                        {t("overdueCount", { count: summary.overdueCount })}
                      </StatusBadge>
                    ) : (
                      <Text size="sm" weight="medium">
                        {t("overdueCount", { count: summary.overdueCount })}
                      </Text>
                    )}
                  </SummaryMetric>
                  {summary.dueSoonCount > 0 ? (
                    <SummaryMetric label={t("dueSoonLabel")}>
                      <StatusBadge tone={StatusBadgeTone.WARNING}>
                        {t("dueSoonCount", { count: summary.dueSoonCount })}
                      </StatusBadge>
                    </SummaryMetric>
                  ) : null}
                </div>
              </Card>
            </section>
          </MotionReveal>
          <section
            className="flex flex-col gap-(--space-2)"
            aria-labelledby="debts-active-heading"
          >
            <div className="flex items-end justify-between gap-(--space-3)">
              <div className="min-w-0">
                <DebtSectionTitle>
                  <span id="debts-active-heading">{t("active")}</span>
                </DebtSectionTitle>
                <Text
                  size="xs"
                  tone="secondary"
                  className="mt-(--space-1) text-pretty"
                >
                  {t("activeHint")}
                </Text>
              </div>
              <Text size="xs" tone="muted" className="shrink-0 tabular-nums">
                {t("sectionCount", { count: activeRows.length })}
              </Text>
            </div>
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              {activeRows.length === 0 ? (
                <DebtGroupEmpty>{t("activeEmptyTitle")}</DebtGroupEmpty>
              ) : (
                <ul className="divide-y divide-divider">
                  {activeRows.map((debt) => {
                    const isBorrowed =
                      debt.direction === DebtDirection.BORROWED;
                    return (
                      <li key={debt.id}>
                        <DebtProductRow
                          href={moneyDebtPath(debt.id)}
                          testId={`debt-row-${debt.id}`}
                          direction={debt.direction}
                          directionLabel={
                            isBorrowed ? t("create.borrowed") : t("create.lent")
                          }
                          title={debt.counterparty}
                          amountLabel={moneyLabel(
                            debt.remainingAmount,
                            debt.currency,
                            locale,
                          )}
                          amountCaption={
                            isBorrowed
                              ? t("remainingToPay")
                              : t("remainingToReceive")
                          }
                          due={debt.due}
                          dueDate={debt.dueDate}
                          dueLabels={dueLabels}
                          locale={locale}
                          progress={debt.progress}
                          progressLabels={progressLabels}
                          ownership={debt.ownership}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>
          {historyRows.length > 0 ? (
            <section
              className="flex flex-col gap-(--space-2)"
              aria-labelledby="debts-history-heading"
              data-testid="debts-history-section"
            >
              <div>
                <DebtSectionTitle>
                  <span id="debts-history-heading">{t("history")}</span>
                </DebtSectionTitle>
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
                  {historyRows.map((debt) => (
                    <li key={debt.id}>
                      <DebtProductRow
                        href={moneyDebtPath(debt.id)}
                        testId={`debt-history-row-${debt.id}`}
                        direction={debt.direction}
                        directionLabel={
                          debt.direction === DebtDirection.BORROWED
                            ? t("create.borrowed")
                            : t("create.lent")
                        }
                        title={debt.counterparty}
                        amountLabel={moneyLabel(
                          debt.principalAmount,
                          debt.currency,
                          locale,
                        )}
                        amountCaption={t("create.principal")}
                        due={debt.due}
                        dueDate={debt.dueDate}
                        dueLabels={dueLabels}
                        locale={locale}
                        progress={debt.progress}
                        progressLabels={progressLabels}
                        ownership={debt.ownership}
                        history
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}
          <DebtCreateSheet
            {...createAccounts}
            trigger={DebtCreateTrigger.FLOATING}
          />
        </div>
      )}
    </Page>
  );
}
