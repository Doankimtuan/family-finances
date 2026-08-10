"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CreditCardDetail } from "@/modules/ledger/application/client";
import {
  CardBillingItemType,
  CardBillingMonthStatus,
  MoneyPaymentFlowStep,
} from "@/modules/ledger/application/client";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { CreditCardDueLead } from "./credit-card-due-lead";
import { CreditCardSettleFlow } from "./credit-card-settle-flow";
import { CreditCardCashbackSection } from "./credit-card-cashback-section";
import { CreditCardStatementsSection } from "./credit-card-statements-section";
import { CreditCardActivitySection } from "./credit-card-activity-section";
import { CreditCardInstallmentsSection } from "./credit-card-installments-section";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type LiquidOption = { id: string; name: string };

type Props = {
  card: CreditCardDetail;
  liquidAccounts: LiquidOption[];
  outstandingLabel: string;
  availableLabel: string;
  currency: string;
};

/**
 * Credit card actions: liability payment (preview → confirm → receipt) and cashback.
 */
export function CreditCardDetailActions({
  card,
  liquidAccounts,
  outstandingLabel,
  availableLabel,
  currency,
}: Props) {
  const t = useTranslations("money.creditCard");
  const locale = useLocale();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [payStep, setPayStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );

  const formatMoney = (amount: number) =>
    formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });

  const openMonths = useMemo(
    () =>
      [...card.months]
        .filter((month) => month.status !== CardBillingMonthStatus.SETTLED)
        .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth)),
    [card.months],
  );
  const leadMonth = openMonths[0] ?? null;
  const remainingDue = leadMonth?.remaining ?? card.outstanding;

  const installmentItems = card.items.filter(
    (item) =>
      item.itemType === CardBillingItemType.INSTALLMENT ||
      item.installmentPlanId != null,
  );
  const activityItems = card.items.filter(
    (item) => item.itemType === CardBillingItemType.STANDARD,
  );

  const canPay = card.outstanding > 0 && liquidAccounts.length > 0;

  const settleFlow = canPay ? (
    <CreditCardSettleFlow
      cardAccountId={card.accountId}
      cardName={card.name}
      outstanding={card.outstanding}
      liquidAccounts={liquidAccounts}
      linkedBankAccountId={card.linkedBankAccountId}
      formatMoney={formatMoney}
      errorCode={errorCode}
      onError={setErrorCode}
      payStep={payStep}
      onPayStepChange={setPayStep}
    />
  ) : null;

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="credit-card-actions"
    >
      {payStep === MoneyPaymentFlowStep.FORM ? (
        <section className="flex flex-col gap-(--space-2)">
          <Text size="sm" tone="secondary">
            {t("heroHint", {
              outstanding: outstandingLabel,
              available: availableLabel,
            })}
          </Text>
          {errorCode ? (
            <StatusAlert
              variant="danger"
              title={t("actionErrorTitle")}
              description={t(`errors.${errorCode}`)}
            />
          ) : null}
        </section>
      ) : null}

      {payStep === MoneyPaymentFlowStep.FORM && leadMonth ? (
        <CreditCardDueLead
          leadMonth={leadMonth}
          remainingDueLabel={formatMoney(remainingDue)}
          statementLabel={formatMoney(leadMonth.statementAmount)}
          paidLabel={formatMoney(leadMonth.paidAmount)}
        />
      ) : null}

      {settleFlow}

      {payStep === MoneyPaymentFlowStep.FORM ? (
        <>
          <CreditCardCashbackSection
            cardAccountId={card.accountId}
            onError={setErrorCode}
          />
          <CreditCardStatementsSection
            months={card.months}
            formatMoney={formatMoney}
          />
          <CreditCardActivitySection
            items={activityItems}
            formatMoney={formatMoney}
          />
          <CreditCardInstallmentsSection
            items={installmentItems}
            formatMoney={formatMoney}
          />
        </>
      ) : null}
    </div>
  );
}
