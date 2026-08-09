"use client";

import { useTranslations } from "next-intl";
import {
  CardBillingMonthStatus,
  type CardBillingMonth,
} from "@/modules/ledger/application/client";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";
import { toYearMonth } from "@/shared/utils/iso-date";

type Props = {
  months: CardBillingMonth[];
  formatMoney: (amount: number) => string;
};

export function CreditCardStatementsSection({ months, formatMoney }: Props) {
  const t = useTranslations("money.creditCard");

  return (
    <section className="flex flex-col gap-(--space-3)">
      <SectionHeader title={t("statementsTitle")} />
      {months.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("statementsEmpty")}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {months.map((month) => (
            <li
              key={month.id}
              className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
              data-billing-status={month.status}
              data-testid={`card-statement-${month.id}`}
            >
              <div className="flex justify-between gap-(--space-2)">
                <Text size="sm" className="font-medium">
                  {toYearMonth(month.billingMonth)}
                </Text>
                <Text size="sm" tone="secondary">
                  {month.status === CardBillingMonthStatus.SETTLED
                    ? t("statusSettled")
                    : month.status === CardBillingMonthStatus.PARTIAL
                      ? t("statusPartial")
                      : t("statusOpen")}
                </Text>
              </div>
              <Text size="sm" className="font-medium tabular-nums">
                {t("statementRemaining", {
                  remaining: formatMoney(month.remaining),
                })}
              </Text>
              <Text size="sm" tone="secondary">
                {t("statementLine", {
                  statement: formatMoney(month.statementAmount),
                  paid: formatMoney(month.paidAmount),
                  due: month.dueDate,
                })}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
