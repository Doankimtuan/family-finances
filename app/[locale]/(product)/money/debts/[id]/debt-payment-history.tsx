import {
  TransactionLedgerType,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application";
import type { DebtPayment } from "@/modules/ledger/application";
import { Link } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { DebtSectionTitle } from "../debt-section-title";

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
  const iconTone = isBorrowed
    ? IconContainerTone.REFUND
    : IconContainerTone.INCOME;
  const totalAmount =
    openingPaidAmount +
    payments.reduce((sum, payment) => sum + payment.amount, 0);
  const hasHistory = payments.length > 0 || openingPaidAmount > 0;

  return (
    <section
      className="flex flex-col gap-(--space-2)"
      data-testid="debt-payment-history"
    >
      <div className="flex items-end justify-between gap-(--space-3)">
        <DebtSectionTitle>{title}</DebtSectionTitle>
        {hasHistory ? (
          <div className="flex flex-col items-end gap-(--space-1)">
            <Text size="xs" tone="secondary">
              {countLabel}
            </Text>
            {totalLabel ? (
              <Text size="xs" tone="muted" className="tabular-nums">
                {totalLabel}{" "}
                <FinancialValue>{formatAmount(totalAmount)}</FinancialValue>
              </Text>
            ) : null}
          </div>
        ) : null}
      </div>
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
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
            className="px-(--space-4) py-(--space-3) text-pretty"
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
            <ul className="divide-y divide-divider">
              {openingPaidAmount > 0 ? (
                <li className="min-h-14">
                  <div className="px-(--space-4)">
                    <TransactionRow
                      className="rounded-none border-0 bg-transparent"
                      leading={
                        <IconContainer tone={iconTone} size="sm">
                          <AppIcon icon={icon} size={AppIconSize.SM} />
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
                  <li key={payment.id} className="min-h-14">
                    <Link
                      href={transactionPath(payment.transactionId)}
                      className="block min-h-14 px-(--space-4) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                      aria-label={`${payment.accountName ?? accountFallback}, ${dateLabel}`}
                    >
                      <TransactionRow
                        className="rounded-none border-0 bg-transparent hover:border-transparent"
                        leading={
                          <IconContainer tone={iconTone} size="sm">
                            <AppIcon icon={icon} size={AppIconSize.SM} />
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
      </Card>
    </section>
  );
}
