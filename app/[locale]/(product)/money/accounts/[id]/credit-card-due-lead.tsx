"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CardBillingMonth } from "@/modules/ledger/application/client";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Text } from "@/shared/ui/text";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { formatDate } from "@/shared/i18n/formatters";
import { toYearMonth } from "@/shared/utils/iso-date";
import { AccountSectionTitle } from "./account-section-title";

type CreditCardDueLeadProps = {
  leadMonth: CardBillingMonth;
  remainingDueLabel: string;
  statementLabel: string;
  paidLabel: string;
  linkedPaymentAccount?: string;
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
  linkedPaymentAccount,
}: CreditCardDueLeadProps) {
  const t = useTranslations("money.creditCard");
  const locale = useLocale();
  const dueDateLabel = formatDate(
    new Date(`${leadMonth.dueDate}T00:00:00Z`),
    locale,
    { day: "numeric", month: "short", year: "numeric" },
  );
  const billingMonthLabel = formatDate(
    new Date(`${toYearMonth(leadMonth.billingMonth)}-01T00:00:00Z`),
    locale,
    { month: "long", year: "numeric" },
  );

  return (
    <Card
      tone="elevated"
      className="gap-0 p-(--space-4)"
      data-surface="statement-due"
      data-testid="card-due-lead"
    >
      <SectionHeader
        title={
          <AccountSectionTitle>
            {t("currentStatementTitle")}
          </AccountSectionTitle>
        }
        description={billingMonthLabel}
      />
      <div className="mt-(--space-3) flex flex-col gap-(--space-3) rounded-(--radius-control) border border-warning/25 bg-warning-soft/60 p-(--space-3)">
        <Text size="sm" weight="semibold" className="text-warning">
          {t("due.dueDate", { date: dueDateLabel })}
        </Text>
        <div className="flex items-end justify-between gap-(--space-3)">
          <Text size="xs" tone="secondary">
            {t("due.remainingLabel")}
          </Text>
          <Amount
            amountLabel={remainingDueLabel}
            tone={AmountTone.NEUTRAL}
            size={AmountSize.MD}
            className="items-end text-right"
            amountClassName="text-debt"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-2)">
          <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
            <AppIcon icon={FINANCE_ICONS.bank} size={AppIconSize.SM} />
          </IconContainer>
          <div className="flex min-w-0 flex-col">
            <Text size="xs" tone="secondary">
              {t("linkedPaymentAccount")}
            </Text>
            <Text size="sm" weight="medium" className="truncate">
              {linkedPaymentAccount ?? t("unlinkedPaymentAccount")}
            </Text>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Text size="xs" tone="secondary">
            {t("paidLabel")}: {paidLabel}
          </Text>
          <Text size="xs" tone="secondary">
            {t("statementLabel")}: {statementLabel}
          </Text>
        </div>
      </div>
    </Card>
  );
}
