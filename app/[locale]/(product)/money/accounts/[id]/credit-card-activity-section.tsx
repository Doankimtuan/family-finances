"use client";

import { useTranslations } from "next-intl";
import type { CardBillingItem } from "@/modules/ledger/application/client";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";

type Props = {
  items: CardBillingItem[];
  formatMoney: (amount: number) => string;
};

export function CreditCardActivitySection({ items, formatMoney }: Props) {
  const t = useTranslations("money.creditCard");

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="card-activity"
    >
      <SectionHeader title={t("activityTitle")} />
      {items.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("activityEmpty")}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border-subtle px-(--space-3) py-(--space-2)"
            >
              <div className="flex justify-between gap-(--space-2)">
                <Text size="sm">
                  {item.description ?? t("activityFallback")}
                </Text>
                <Text size="sm" className="tabular-nums font-medium">
                  {formatMoney(item.amount)}
                </Text>
              </div>
              <Text size="sm" tone="secondary">
                {item.isPaid ? t("activityPaid") : t("activityUnpaid")}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
