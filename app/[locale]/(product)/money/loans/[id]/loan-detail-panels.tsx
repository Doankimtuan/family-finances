import { Link } from "@/i18n/navigation";
import {
  LoanDueState,
  LoanScheduleDisplayStatus,
  LoanScheduleEntryStatus,
  type LoanScheduleDisplayStatus as LoanScheduleDisplayStatusValue,
  type LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
} from "@/modules/ledger/application/loan-constants";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { LoanScheduleStatusBadge } from "@/modules/ledger/ui/loan-presentation";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { LoanSectionTitle } from "../loan-section-title";

const LOAN_SCHEDULE_ATTENTION_SURFACE: Partial<
  Record<LoanScheduleDisplayStatusValue, string>
> = {
  [LoanScheduleDisplayStatus.DUE_TODAY]: "bg-warning/10",
  [LoanScheduleDisplayStatus.OVERDUE]: "bg-danger/10",
};

type ScheduleEntry = {
  id: string;
  sequence: number;
  dueDate: string;
  totalDue: number;
  principalDue: number;
  interestDue: number;
  remainingBalanceAfter: number;
  status: LoanScheduleEntryStatusValue;
};

type PaymentEntry = {
  id: string;
  accountId: string;
  paidAt: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  transactionId: string | null;
};

type RatePeriod = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  kind: string;
  annualRate: number;
};

// Accept next-intl translators without coupling panels to message key unions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translate = (key: any, values?: any) => string;

export function LoanSchedulePanel({
  title,
  emptyLabel,
  entries,
  formatMoney,
  t,
  today,
}: {
  title: string;
  emptyLabel: string;
  entries: ScheduleEntry[];
  formatMoney: (n: number) => string;
  t: Translate;
  today: string;
}) {
  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-schedule"
    >
      <LoanSectionTitle>{title}</LoanSectionTitle>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        {entries.length === 0 ? (
          <EmptyState title={emptyLabel} className="flex-none py-(--space-2)" />
        ) : (
          <ul
            className="divide-y divide-divider"
            data-slot="loan-schedule-list"
          >
            {entries.map((entry) => {
              const displayStatus = scheduleDisplayStatus(entry, today);
              const isImmutable =
                entry.status === LoanScheduleEntryStatus.PAID ||
                entry.status === LoanScheduleEntryStatus.WAIVED;
              const statusLabel = t(`scheduleStatus.${displayStatus}`);
              return (
                <li
                  key={entry.id}
                  className={cn(
                    "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3)",
                    LOAN_SCHEDULE_ATTENTION_SURFACE[displayStatus],
                  )}
                  data-testid={`loan-schedule-${entry.sequence}`}
                  data-schedule-status={entry.status}
                  data-schedule-display-status={displayStatus}
                >
                  <div className="min-w-0 flex-1">
                    <Text
                      size="sm"
                      className="min-w-0 font-medium text-text-primary"
                    >
                      {t("scheduleMonth", {
                        month: entry.sequence,
                        date: entry.dueDate,
                      })}
                    </Text>
                    <Text
                      size="xs"
                      tone="secondary"
                      className="mt-(--space-1) text-pretty"
                    >
                      <FinancialValue>
                        {t("scheduleSplit", {
                          principal: formatMoney(entry.principalDue),
                          interest: formatMoney(entry.interestDue),
                          remaining: formatMoney(entry.remainingBalanceAfter),
                        })}
                      </FinancialValue>
                    </Text>
                    {isImmutable ? (
                      <Text size="xs" tone="muted" className="mt-(--space-1)">
                        {t("scheduleImmutable")}
                      </Text>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-(--space-1)">
                    <Text
                      size="sm"
                      className="tabular-nums font-semibold text-text-primary"
                    >
                      <FinancialValue>
                        {formatMoney(entry.totalDue)}
                      </FinancialValue>
                    </Text>
                    <LoanScheduleStatusBadge
                      status={displayStatus}
                      label={statusLabel}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

function scheduleDisplayStatus(
  entry: ScheduleEntry,
  today: string,
): (typeof LoanScheduleDisplayStatus)[keyof typeof LoanScheduleDisplayStatus] {
  if (entry.status === LoanScheduleEntryStatus.PAID) {
    return LoanScheduleDisplayStatus.PAID;
  }
  if (entry.status === LoanScheduleEntryStatus.WAIVED) {
    return LoanScheduleDisplayStatus.WAIVED;
  }
  const dueState = getLoanDueState(entry.dueDate, today);
  if (dueState === LoanDueState.DUE_TODAY) {
    return LoanScheduleDisplayStatus.DUE_TODAY;
  }
  if (dueState === LoanDueState.OVERDUE) {
    return LoanScheduleDisplayStatus.OVERDUE;
  }
  return LoanScheduleDisplayStatus.UPCOMING;
}

export function LoanPaymentHistoryPanel({
  title,
  payments,
  formatMoney,
  accountNames,
  t,
}: {
  title: string;
  payments: PaymentEntry[];
  formatMoney: (n: number) => string;
  accountNames: ReadonlyMap<string, string>;
  t: Translate;
}) {
  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-payment-history"
    >
      <LoanSectionTitle>{title}</LoanSectionTitle>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        {payments.length === 0 ? (
          <EmptyState
            title={t("historyEmpty")}
            className="flex-none py-(--space-2)"
          />
        ) : (
          <ul className="divide-y divide-divider">
            {payments.map((payment) => {
              const accountLabel = t("historyAccount", {
                account:
                  accountNames.get(payment.accountId) ?? t("unknownAccount"),
              });
              const splitLabel = t("historySplit", {
                principal: formatMoney(payment.principalPaid),
                interest: formatMoney(payment.interestPaid),
              });
              const row = (
                <TransactionRow
                  className="rounded-none border-0 bg-transparent hover:border-transparent"
                  title={payment.paidAt}
                  subtitle={
                    <>
                      <FinancialValue>{splitLabel}</FinancialValue>
                      {` · ${accountLabel}`}
                    </>
                  }
                  amountLabel={formatMoney(payment.amount)}
                  tone={TransactionAmountTone.NEUTRAL}
                  showRail={false}
                  showChevron={Boolean(payment.transactionId)}
                />
              );

              return (
                <li
                  key={payment.id}
                  className="min-h-14"
                  data-testid={`loan-payment-${payment.id}`}
                >
                  {payment.transactionId ? (
                    <Link
                      href={moneyTransactionPath(payment.transactionId)}
                      className="block min-h-14 px-(--space-4) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                      aria-label={`${payment.paidAt}, ${t("historyTransaction")}`}
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="px-(--space-4)">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

export function LoanRateHistoryPanel({
  title,
  emptyLabel,
  periods,
  openLabel,
  kindLabel,
  t,
}: {
  title: string;
  emptyLabel: string;
  periods: RatePeriod[];
  openLabel: string;
  kindLabel: (kind: string) => string;
  t: Translate;
}) {
  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-rate-history"
    >
      <LoanSectionTitle>{title}</LoanSectionTitle>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        {periods.length === 0 ? (
          <EmptyState title={emptyLabel} className="flex-none py-(--space-2)" />
        ) : (
          <ul className="divide-y divide-divider">
            {periods.map((period) => (
              <li key={period.id} className="px-(--space-4) py-(--space-3)">
                <Text size="sm" tone="secondary" className="text-pretty">
                  {t("rateHistoryRow", {
                    kind: kindLabel(period.kind),
                    rate: String(period.annualRate),
                    from: period.effectiveFrom,
                    to: period.effectiveTo ?? openLabel,
                  })}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
