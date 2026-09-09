"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import type { CardBillingItem } from "@/modules/ledger/application/client";
import {
  TransactionDirection,
  TRANSACTION_LEDGER_AMOUNT_PREFIX,
} from "@/modules/ledger/application/client";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import {
  ACCOUNT_ACTIVITY_LIST_CLASS,
  ACCOUNT_DETAIL_PREVIEW_CONFIG,
} from "./detail-constants";
import { AccountSectionTitle } from "./account-section-title";
import { AccountViewActivityAction } from "./account-view-activity-action";

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
        title={<AccountSectionTitle>{t("activityTitle")}</AccountSectionTitle>}
        action={<AccountViewActivityAction testId="card-quick-activity" />}
      />
      {previewItems.length === 0 ? (
        <EmptyState
          title={t("activityEmpty")}
          description={t("activityEmptyDescription")}
          icon={
            <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.DISPLAY} />
          }
          className="flex-none py-(--space-4)"
        />
      ) : (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <ul className={ACCOUNT_ACTIVITY_LIST_CLASS}>
            {previewItems.map((item) => {
              const isLinked = Boolean(item.transactionId);
              const row = (
                <TransactionRow
                  leading={
                    <IconContainer tone={IconContainerTone.DEBT} size="sm">
                      <AppIcon
                        icon={FINANCE_ICONS.card}
                        size={AppIconSize.SM}
                      />
                    </IconContainer>
                  }
                  title={item.description ?? t("activityFallback")}
                  subtitle={
                    <StatusBadge
                      tone={
                        item.isPaid
                          ? StatusBadgeTone.SUCCESS
                          : StatusBadgeTone.WARNING
                      }
                    >
                      {item.isPaid ? t("activityPaid") : t("activityUnpaid")}
                    </StatusBadge>
                  }
                  amountLabel={`${TRANSACTION_LEDGER_AMOUNT_PREFIX[TransactionDirection.EXPENSE]}${formatMoney(item.amount)}`}
                  tone={TransactionAmountTone.DEBIT}
                  showChevron={isLinked}
                />
              );

              return (
                <li key={item.id}>
                  {item.transactionId ? (
                    <Link
                      href={moneyTransactionPath(item.transactionId)}
                      className="block rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );
}
