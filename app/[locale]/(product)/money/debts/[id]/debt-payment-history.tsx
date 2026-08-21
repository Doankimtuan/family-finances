import {
  TransactionLedgerType,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application";
import type { DebtPayment } from "@/modules/ledger/application";
import { Link } from "@/i18n/navigation";
import { StatusAlert } from "@/shared/ui/status-alert";
import { SectionHeader } from "@/shared/patterns/section-header";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";

type DebtPaymentHistoryProps = {
  title: string;
  countLabel: string;
  emptyTitle: string;
  accountFallback: string;
  isBorrowed: boolean;
  payments: DebtPayment[];
  formatAmount: (amount: number) => string;
  formatDate: (isoDate: string) => string;
  transactionPath: (transactionId: string) => string;
  retryHref: string;
  readError: boolean;
  readErrorTitle: string;
  readErrorDescription: string;
  retryLabel: string;
  openingPaidAmount?: number;
  openingLabel?: string;
  totalLabel?: string;
  reconciliationWarning?: string;
};

export function DebtPaymentHistory({
  title,
  countLabel,
  emptyTitle,
  accountFallback,
  isBorrowed,
  payments,
  formatAmount,
  formatDate,
  transactionPath,
  retryHref,
  readError,
  readErrorTitle,
  readErrorDescription,
  retryLabel,
  openingPaidAmount = 0,
  openingLabel = "",
  totalLabel,
  reconciliationWarning,
}: DebtPaymentHistoryProps) {
  const amountPrefix = isBorrowed
    ? TRANSACTION_LEDGER_AMOUNT_PREFIX[TransactionLedgerType.LIABILITY_PAYMENT]
    : TRANSACTION_LEDGER_AMOUNT_PREFIX[
        TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT
      ];
  const tone = isBorrowed
    ? TransactionAmountTone.DEBIT
    : TransactionAmountTone.CREDIT;
  const icon = isBorrowed ? FINANCE_ICONS.expense : FINANCE_ICONS.income;
  const iconTone = isBorrowed ? "refund" : "income";
  const totalAmount =
    openingPaidAmount +
    payments.reduce((total, payment) => total + payment.amount, 0);
  const hasHistory = payments.length > 0 || openingPaidAmount > 0;

  return (
    <section data-testid="debt-payment-history">
      <div className="overflow-hidden rounded-card border border-border-subtle/60 bg-surface">
        <div className="px-(--space-4) pt-(--space-4) pb-(--space-1)">
          <SectionHeader
            title={
              <div className="flex w-full items-baseline justify-between gap-(--space-3)">
                <Heading
                  level={2}
                  className="text-base font-semibold tracking-tight"
                >
                  {title}
                </Heading>
                {hasHistory ? (
                  <div className="flex flex-col items-end gap-1">
                    <Text size="sm" tone="secondary">
                      {countLabel}
                    </Text>
                    {totalLabel ? (
                      <Text size="xs" tone="secondary" className="tabular-nums">
                        {totalLabel}{" "}
                        <FinancialValue>
                          {formatAmount(totalAmount)}
                        </FinancialValue>
                      </Text>
                    ) : null}
                  </div>
                ) : null}
              </div>
            }
          />
        </div>
        {readError ? (
          <StatusAlert
            variant="danger"
            title={readErrorTitle}
            description={readErrorDescription}
            action={
              <Link
                href={retryHref}
                className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="debt-history-retry"
              >
                {retryLabel}
              </Link>
            }
            className="m-(--space-4)"
            data-testid="debt-history-read-error"
          />
        ) : !hasHistory ? (
          <Text
            size="sm"
            tone="secondary"
            className="px-(--space-4) pb-(--space-4)"
          >
            {emptyTitle}
          </Text>
        ) : (
          <>
            {reconciliationWarning ? (
              <StatusAlert
                variant="danger"
                title={reconciliationWarning}
                className="m-(--space-4)"
                data-testid="debt-history-reconciliation-warning"
              />
            ) : null}
            <ul className="divide-y divide-border-subtle">
              {openingPaidAmount > 0 ? (
                <li>
                  <div className="block min-h-11 px-3">
                    <TransactionRow
                      className="rounded-none border-0 bg-transparent"
                      leading={
                        <IconContainer tone={iconTone} size="sm">
                          <AppIcon icon={icon} size="sm" />
                        </IconContainer>
                      }
                      title={openingLabel}
                      amountLabel={`${amountPrefix}${formatAmount(openingPaidAmount)}`}
                      tone={tone}
                    />
                  </div>
                </li>
              ) : null}
              {payments.map((payment) => {
                const dateLabel = formatDate(payment.effectiveDate);
                const subtitle = payment.note
                  ? `${dateLabel}, ${payment.note}`
                  : dateLabel;
                return (
                  <li key={payment.id}>
                    <Link
                      href={transactionPath(payment.transactionId)}
                      className="block min-h-11 px-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                      aria-label={`${payment.accountName ?? accountFallback}, ${dateLabel}`}
                    >
                      <TransactionRow
                        className="rounded-none border-0 bg-transparent hover:border-transparent"
                        leading={
                          <IconContainer tone={iconTone} size="sm">
                            <AppIcon icon={icon} size="sm" />
                          </IconContainer>
                        }
                        title={payment.accountName ?? accountFallback}
                        subtitle={subtitle}
                        amountLabel={`${amountPrefix}${formatAmount(payment.amount)}`}
                        tone={tone}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
