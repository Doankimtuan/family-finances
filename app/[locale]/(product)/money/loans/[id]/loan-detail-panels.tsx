import { Link } from "@/i18n/navigation";
import {
  LoanScheduleEntryStatus,
  type LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
} from "@/modules/ledger/application/ledger-constants";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
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
}: {
  title: string;
  emptyLabel: string;
  entries: ScheduleEntry[];
  formatMoney: (n: number) => string;
  t: Translate;
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
                  {formatMoney(entry.totalDue)}
                </Text>
              </div>
              <Text size="sm" tone="secondary">
                {t("scheduleSplit", {
                  principal: formatMoney(entry.principalDue),
                  interest: formatMoney(entry.interestDue),
                  remaining: formatMoney(entry.remainingBalanceAfter),
                })}
              </Text>
              <Text size="sm" tone="secondary">
                {t(`scheduleStatus.${entry.status}`)}
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

export function LoanPaymentHistoryPanel({
  title,
  payments,
  formatMoney,
  t,
}: {
  title: string;
  payments: PaymentEntry[];
  formatMoney: (n: number) => string;
  t: Translate;
}) {
  if (payments.length === 0) return null;

  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-payment-history"
    >
      <Text size="sm" className="font-medium">
        {title}
      </Text>
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
                {formatMoney(payment.amount)}
              </Text>
            </div>
            <Text size="sm" tone="secondary">
              {t("historySplit", {
                principal: formatMoney(payment.principalPaid),
                interest: formatMoney(payment.interestPaid),
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
  periods,
  openLabel,
  kindLabel,
  t,
}: {
  title: string;
  periods: RatePeriod[];
  openLabel: string;
  kindLabel: (kind: string) => string;
  t: Translate;
}) {
  if (periods.length === 0) return null;

  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="loan-rate-history"
    >
      <Text size="sm" className="font-medium">
        {title}
      </Text>
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
    </section>
  );
}
