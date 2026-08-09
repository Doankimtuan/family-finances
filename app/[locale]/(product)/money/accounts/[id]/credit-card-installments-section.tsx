"use client";

import { useTranslations } from "next-intl";
import type { CardBillingItem } from "@/modules/ledger/application/client";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";

type Props = {
  items: CardBillingItem[];
  formatMoney: (amount: number) => string;
};

export function CreditCardInstallmentsSection({ items, formatMoney }: Props) {
  const t = useTranslations("money.creditCard");

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="card-installments"
    >
      <SectionHeader title={t("emiTitle")} />
      {items.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("emiEmpty")}
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
                  {item.description ?? t("convertItemFallback")}
                </Text>
                <Text size="sm" className="tabular-nums font-medium">
                  {formatMoney(item.amount)}
                </Text>
              </div>
              <Text size="sm" tone="secondary">
                {t("emiCardOrigin")}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
