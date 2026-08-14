import {
  TransactionLedgerType,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application";
import type { DebtPayment } from "@/modules/ledger/application";
import { SectionHeader } from "@/shared/patterns/section-header";
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
                {payments.length > 0 ? (
                  <Text size="sm" tone="secondary">
                    {countLabel}
                  </Text>
                ) : null}
              </div>
            }
          />
        </div>
        {payments.length === 0 ? (
          <Text
            size="sm"
            tone="secondary"
            className="px-(--space-4) pb-(--space-4)"
          >
            {emptyTitle}
          </Text>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {payments.map((payment) => {
              const dateLabel = formatDate(payment.effectiveDate);
              const subtitle = payment.note
                ? `${dateLabel}, ${payment.note}`
                : dateLabel;
              return (
                <li key={payment.id}>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
