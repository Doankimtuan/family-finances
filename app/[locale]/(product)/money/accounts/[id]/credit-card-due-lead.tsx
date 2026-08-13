"use client";

import { useTranslations } from "next-intl";
import type { CardBillingMonth } from "@/modules/ledger/application/client";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
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
      className="flex flex-col gap-(--space-4) rounded-[var(--radius-card)] bg-surface-muted px-(--space-4) py-(--space-4)"
      data-testid="card-due-lead"
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div>
          <SectionHeader title={t("currentStatementTitle")} />
          <Text size="sm" tone="secondary" className="mt-(--space-1)">
            {toYearMonth(leadMonth.billingMonth)}
          </Text>
        </div>
        <Text size="sm" tone="secondary" className="shrink-0">
          {t("due.dueDate", { date: leadMonth.dueDate })}
        </Text>
      </div>
      <div>
        <Text size="sm" tone="secondary">
          {t("due.remainingLabel")}
        </Text>
        <p className="mt-(--space-1) text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
          {remainingDueLabel}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t("paymentProgressLabel", { percent: paymentProgress })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={paymentProgress}
        className="h-2 overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-debt transition-[width] duration-[var(--duration-fast)] motion-reduce:transition-none"
          style={{ width: `${paymentProgress}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-(--space-3)">
        <div>
          <Text size="sm" tone="secondary">
            {t("paidLabel")}
          </Text>
          <Text
            size="sm"
            weight="medium"
            className="tabular-nums text-text-primary"
          >
            {paidLabel}
          </Text>
        </div>
        <div className="text-right">
          <Text size="sm" tone="secondary">
            {t("statementLabel")}
          </Text>
          <Text
            size="sm"
            weight="medium"
            className="tabular-nums text-text-primary"
          >
            {statementLabel}
          </Text>
        </div>
      </div>
    </section>
  );
}
