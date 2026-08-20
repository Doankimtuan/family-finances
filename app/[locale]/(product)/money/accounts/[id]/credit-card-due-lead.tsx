"use client";

import { useTranslations } from "next-intl";
import type { CardBillingMonth } from "@/modules/ledger/application/client";
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
    <section
      className="flex flex-col gap-(--space-4) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface-muted px-(--space-4) py-(--space-4)"
      data-surface="soft-bounded"
      data-testid="card-due-lead"
    >
      <div>
        <SectionHeader title={t("currentStatementTitle")} />
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {toYearMonth(leadMonth.billingMonth)}
        </Text>
      </div>
      <div className="flex items-end justify-between gap-(--space-3) border-y border-border-subtle/70 py-(--space-3)">
        <Text size="sm" tone="secondary">
          {t("due.dueLabel")}
        </Text>
        <Text size="sm" weight="medium" className="shrink-0 tabular-nums">
          {leadMonth.dueDate}
        </Text>
      </div>
      <div>
        <Amount
          label={t("due.remainingLabel")}
          amountLabel={remainingDueLabel}
          tone={AmountTone.NEUTRAL}
          size={AmountSize.MD}
        />
      </div>
      <Progress
        value={paymentProgress}
        label={t("paymentProgressLabel", { percent: paymentProgress })}
        showLabel={false}
        trackClassName="bg-surface"
        indicatorClassName="bg-accent"
      />
      <div className="grid grid-cols-2 gap-(--space-3)">
        <Amount
          label={t("paidLabel")}
          amountLabel={paidLabel}
          size={AmountSize.SM}
        />
        <Amount
          label={t("statementLabel")}
          amountLabel={statementLabel}
          size={AmountSize.SM}
          className="items-end text-right"
        />
      </div>
    </section>
  );
}
