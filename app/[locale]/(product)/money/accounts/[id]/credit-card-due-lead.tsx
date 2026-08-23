"use client";

import { useTranslations } from "next-intl";
import type { CardBillingMonth } from "@/modules/ledger/application/client";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { toYearMonth } from "@/shared/utils/iso-date";

type CreditCardDueLeadProps = {
  leadMonth: CardBillingMonth;
  remainingDueLabel: string;
  statementLabel: string;
  paidLabel: string;
  paymentProgress: number;
};

/**
 * Current billing period, arranged around the amount that remains actionable
 * rather than a history-style statement list.
 */
export function CreditCardDueLead({
  leadMonth,
  remainingDueLabel,
  statementLabel,
  paidLabel,
  paymentProgress,
}: CreditCardDueLeadProps) {
  const t = useTranslations("money.creditCard");

  return (
    <Card
      tone="elevated"
      className="gap-0 p-(--space-4)"
      data-surface="statement-due"
      data-testid="card-due-lead"
    >
      <SectionHeader
        title={t("currentStatementTitle")}
        description={toYearMonth(leadMonth.billingMonth)}
      />
      <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3) border-y border-border-subtle py-(--space-3)">
        <Text size="sm" tone="secondary">
          {t("due.dueLabel")}
        </Text>
        <Text size="sm" weight="medium" className="shrink-0 tabular-nums">
          {leadMonth.dueDate}
        </Text>
      </div>
      <Amount
        label={t("due.remainingLabel")}
        amountLabel={remainingDueLabel}
        tone={AmountTone.NEUTRAL}
        size={AmountSize.LG}
        className="mt-(--space-4)"
      />
      <Progress
        value={paymentProgress}
        label={t("paymentProgressLabel", { percent: paymentProgress })}
        showLabel={false}
        className="mt-(--space-4)"
        trackClassName="bg-surface-muted"
        indicatorClassName="bg-accent"
      />
      <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
        <Amount
          label={t("paidLabel")}
          amountLabel={paidLabel}
          size={AmountSize.SM}
          amountClassName="text-text-primary"
        />
        <Amount
          label={t("statementLabel")}
          amountLabel={statementLabel}
          size={AmountSize.SM}
          className="items-end text-right"
          amountClassName="text-text-primary"
        />
      </div>
    </Card>
  );
}
