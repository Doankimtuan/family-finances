"use client";

import { useTranslations } from "next-intl";
import type { CardBillingMonth } from "@/modules/ledger/application/client";
import { Amount } from "@/shared/patterns/amount";
import { Text } from "@/shared/ui/text";
import { toYearMonth } from "@/shared/utils/iso-date";

type Props = {
  leadMonth: CardBillingMonth;
  remainingDueLabel: string;
  statementLabel: string;
  paidLabel: string;
};

export function CreditCardDueLead({
  leadMonth,
  remainingDueLabel,
  statementLabel,
  paidLabel,
}: Props) {
  const t = useTranslations("money.creditCard");

  return (
    <section
      className="flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="card-due-lead"
    >
      <Amount
        label={t("due.remainingLabel")}
        amountLabel={remainingDueLabel}
        size="lg"
      />
      <Text size="sm" tone="secondary">
        {t("due.dueDate", { date: leadMonth.dueDate })}
      </Text>
      <Text size="sm" tone="secondary">
        {t("due.statementPaid", {
          statement: statementLabel,
          paid: paidLabel,
          period: toYearMonth(leadMonth.billingMonth),
        })}
      </Text>
      <Text size="sm" tone="secondary">
        {t("due.recordedSource")}
      </Text>
    </section>
  );
}
