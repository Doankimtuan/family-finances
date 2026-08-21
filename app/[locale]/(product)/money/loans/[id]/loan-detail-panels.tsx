import { Link } from "@/i18n/navigation";
import {
  LoanDueState,
  LoanScheduleDisplayStatus,
  LoanScheduleEntryStatus,
  type LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
} from "@/modules/ledger/application/ledger-constants";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";

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
      id="loan-schedule"
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-schedule"
    >
      <Text size="sm" className="font-medium">
        {title}
      </Text>
      {entries.length === 0 ? (
        <Text size="sm" tone="secondary">
          {emptyLabel}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
              data-testid={`loan-schedule-${entry.sequence}`}
              data-schedule-status={entry.status}
            >
              <div className="flex justify-between gap-(--space-2)">
                <Text size="sm">
                  {t("scheduleMonth", {
                    month: entry.sequence,
                    date: entry.dueDate,
                  })}
                </Text>
                <Text size="sm" className="tabular-nums font-medium">
                  <FinancialValue>{formatMoney(entry.totalDue)}</FinancialValue>
                </Text>
              </div>
              <Text
                size="sm"
                tone="secondary"
                className={scheduleStatusClass(
                  scheduleDisplayStatus(entry, today),
                )}
              >
                <FinancialValue>
                  {t("scheduleSplit", {
                    principal: formatMoney(entry.principalDue),
                    interest: formatMoney(entry.interestDue),
                    remaining: formatMoney(entry.remainingBalanceAfter),
                  })}
                </FinancialValue>
              </Text>
              <Text size="sm" tone="secondary">
                {t(`scheduleStatus.${scheduleDisplayStatus(entry, today)}`)}
                {entry.status === LoanScheduleEntryStatus.PAID ||
                entry.status === LoanScheduleEntryStatus.WAIVED
                  ? ` · ${t("scheduleImmutable")}`
                  : ""}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function scheduleDisplayStatus(
  entry: ScheduleEntry,
  today: string,
): LoanScheduleDisplayStatus {
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

function scheduleStatusClass(status: LoanScheduleDisplayStatus): string {
  if (status === LoanScheduleDisplayStatus.OVERDUE)
    return "font-semibold text-danger";
  if (status === LoanScheduleDisplayStatus.DUE_TODAY)
    return "font-semibold text-warning";
  if (status === LoanScheduleDisplayStatus.PAID)
    return "font-medium text-success";
  if (status === LoanScheduleDisplayStatus.WAIVED)
    return "font-medium text-info";
  return "text-info";
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
      <Text size="sm" className="font-medium">
        {title}
      </Text>
      {payments.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("historyEmpty")}
        </Text>
      ) : null}
      <ul className="flex flex-col gap-(--space-2)">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
            data-testid={`loan-payment-${payment.id}`}
          >
            <div className="flex justify-between gap-(--space-2)">
              <Text size="sm">{payment.paidAt}</Text>
              <Text size="sm" className="tabular-nums font-medium">
                <FinancialValue>{formatMoney(payment.amount)}</FinancialValue>
              </Text>
            </div>
            <Text size="sm" tone="secondary">
              <FinancialValue>
                {t("historySplit", {
                  principal: formatMoney(payment.principalPaid),
                  interest: formatMoney(payment.interestPaid),
                })}
              </FinancialValue>
            </Text>
            <Text size="sm" tone="secondary">
              {t("historyAccount", {
                account:
                  accountNames.get(payment.accountId) ?? t("unknownAccount"),
              })}
            </Text>
            {payment.transactionId ? (
              <Link
                href={moneyTransactionPath(payment.transactionId)}
                className="text-sm font-medium text-accent"
              >
                {t("historyTransaction")}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
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
      <Text size="sm" className="font-medium">
        {title}
      </Text>
      {periods.length === 0 ? (
        <Text size="sm" tone="secondary">
          {emptyLabel}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {periods.map((period) => (
            <li key={period.id}>
              <Text size="sm" tone="secondary">
                {t("rateHistoryRow", {
                  from: period.effectiveFrom,
                  to: period.effectiveTo ?? openLabel,
                  kind: kindLabel(period.kind),
                  rate: String(period.annualRate),
                })}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
