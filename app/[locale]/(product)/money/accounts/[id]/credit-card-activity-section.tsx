"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { CardBillingItem } from "@/modules/ledger/application/client";
import {
  TransactionDirection,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application/client";
import { SectionHeader } from "@/shared/patterns/section-header";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { ACCOUNT_DETAIL_PREVIEW_CONFIG } from "./detail-constants";

type CreditCardActivitySectionProps = {
  items: CardBillingItem[];
  formatMoney: (amount: number) => string;
};

/** A bounded card-purchase preview; the transactions domain remains authoritative. */
export function CreditCardActivitySection({
  items,
  formatMoney,
}: CreditCardActivitySectionProps) {
  const t = useTranslations("money.creditCard");
  const tAccount = useTranslations("money.accountDetail");
  const previewItems = items.slice(
    0,
    ACCOUNT_DETAIL_PREVIEW_CONFIG.CARD_ACTIVITY_LIMIT,
  );

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="card-activity"
    >
      <SectionHeader
        title={t("activityTitle")}
        action={
          <Link href={APP_PATH.MONEY_TRANSACTIONS}>
            {tAccount("viewActivity")}
          </Link>
        }
      />
      {previewItems.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("activityEmpty")}
        </Text>
      ) : (
        <ul className="flex flex-col">
          {previewItems.map((item) => (
            <li key={item.id}>
              <TransactionRow
                leading={
                  <IconContainer tone="debt" size="sm">
                    <AppIcon icon={FINANCE_ICONS.card} size="sm" />
                  </IconContainer>
                }
                title={item.description ?? t("activityFallback")}
                subtitle={item.isPaid ? t("activityPaid") : t("activityUnpaid")}
                amountLabel={`${TRANSACTION_LEDGER_AMOUNT_PREFIX[TransactionDirection.EXPENSE]}${formatMoney(item.amount)}`}
                tone={TransactionAmountTone.DEBIT}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
