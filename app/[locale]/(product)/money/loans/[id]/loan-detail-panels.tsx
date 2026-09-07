import { Link } from "@/i18n/navigation";
import {
  LoanDueState,
  LoanScheduleDisplayStatus,
  LoanScheduleEntryStatus,
  type LoanScheduleEntryStatus as LoanScheduleEntryStatusValue,
} from "@/modules/ledger/application/loan-constants";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { LoanScheduleStatusBadge } from "@/modules/ledger/ui/loan-presentation";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";
import { LoanSectionTitle } from "../loan-section-title";

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
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)"
                  data-testid={`loan-schedule-${entry.sequence}`}
                  data-schedule-status={entry.status}
                >
                  <div className="flex items-start justify-between gap-(--space-2)">
                    <Text
                      size="sm"
                      className="min-w-0 font-medium text-text-primary"
                    >
                      {t("scheduleMonth", {
                        month: entry.sequence,
                        date: entry.dueDate,
                      })}
                    </Text>
                    <div className="flex shrink-0 flex-col items-end gap-(--space-1)">
                      <Text size="sm" className="tabular-nums font-semibold">
                        <FinancialValue>
                          {formatMoney(entry.totalDue)}
                        </FinancialValue>
                      </Text>
                      <LoanScheduleStatusBadge
                        status={displayStatus}
                        label={t(`scheduleStatus.${displayStatus}`)}
                      />
                    </div>
                  </div>
                  <div className="flex w-full">
                    <ScheduleFact
                      label={t("schedulePrincipal")}
                      value={formatMoney(entry.principalDue)}
                      align="start"
                    />
                    <ScheduleFact
                      label={t("scheduleInterest")}
                      value={formatMoney(entry.interestDue)}
                      align="center"
                    />
                    <ScheduleFact
                      label={t("scheduleRemaining")}
                      value={formatMoney(entry.remainingBalanceAfter)}
                      align="end"
                    />
                  </div>
                  {isImmutable ? (
                    <Text size="xs" tone="secondary">
                      {t("scheduleImmutable")}
                    </Text>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

function ScheduleFact({
  label,
  value,
  align = "start",
}: {
  label: string;
  value: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 basis-0",
        align === "center" && "text-center",
        align === "end" && "text-end",
      )}
    >
      <Text size="xs" tone="secondary">
        {label}
      </Text>
      <Text
        size="sm"
        tabular
        className="mt-(--space-1) truncate text-text-primary"
      >
        <FinancialValue>{value}</FinancialValue>
      </Text>
    </div>
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
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-(--space-2) px-(--space-4) py-(--space-3)"
                data-testid={`loan-payment-${payment.id}`}
              >
                <div className="flex items-start justify-between gap-(--space-2)">
                  <Text size="sm" className="font-medium">
                    {payment.paidAt}
                  </Text>
                  <Text size="sm" className="tabular-nums font-semibold">
                    <FinancialValue>
                      {formatMoney(payment.amount)}
                    </FinancialValue>
                  </Text>
                </div>
                <Text size="sm" tone="secondary" className="text-pretty">
                  <FinancialValue>
                    {t("historySplit", {
                      principal: formatMoney(payment.principalPaid),
                      interest: formatMoney(payment.interestPaid),
                    })}
                  </FinancialValue>
                </Text>
                <Text size="sm" tone="secondary" className="text-pretty">
                  {t("historyAccount", {
                    account:
                      accountNames.get(payment.accountId) ??
                      t("unknownAccount"),
                  })}
                </Text>
                {payment.transactionId ? (
                  <Link
                    href={moneyTransactionPath(payment.transactionId)}
                    className="inline-flex min-h-11 items-center gap-(--space-1) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {t("historyTransaction")}
                    <AppIcon
                      icon={ACTION_ICONS.forward}
                      size={AppIconSize.XS}
                    />
                  </Link>
                ) : null}
              </li>
            ))}
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
