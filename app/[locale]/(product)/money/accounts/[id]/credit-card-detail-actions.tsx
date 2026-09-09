"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  CreditCardDetail,
  CreditCardInstallment,
} from "@/modules/ledger/application/client";
import {
  CardBillingItemType,
  CardBillingMonthStatus,
  MoneyPaymentFlowStep,
} from "@/modules/ledger/application/client";
import { formatCurrency } from "@/shared/i18n/formatters";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { CreditCardActivitySection } from "./credit-card-activity-section";
import { CreditCardDueLead } from "./credit-card-due-lead";
import { CreditCardInstallmentsSection } from "./credit-card-installments-section";
import { CreditCardSettleFlow } from "./credit-card-settle-flow";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type LiquidOption = { id: string; name: string };

type CreditCardDetailActionsProps = {
  card: CreditCardDetail;
  liquidAccounts: LiquidOption[];
  currency: string;
  installments: CreditCardInstallment[];
  eligiblePurchases: Array<{
    id: string;
    description: string | null;
    amount: number;
    transactionDate: string;
    categoryId: string | null;
    status: string;
  }>;
  canMutate?: boolean;
};

/**
 * Decision layer for credit cards. It keeps the overview focused on the open
 * statement, defers mutation forms to a sheet, and retains existing ledger flows.
 */
export function CreditCardDetailActions({
  card,
  liquidAccounts,
  currency,
  installments,
  eligiblePurchases,
  canMutate = true,
}: CreditCardDetailActionsProps) {
  const t = useTranslations("money.creditCard");
  const locale = useLocale();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [payStep, setPayStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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
  const statementAmount = leadMonth?.statementAmount ?? 0;
  const paymentProgress =
    statementAmount > 0
      ? Math.min(
          Math.max(
            Math.round(((leadMonth?.paidAmount ?? 0) / statementAmount) * 100),
            0,
          ),
          100,
        )
      : 0;
  const activityItems = card.items.filter(
    (item) => item.itemType === CardBillingItemType.STANDARD,
  );
  const canPay = card.outstanding > 0 && liquidAccounts.length > 0;

  const closePayment = () => {
    setErrorCode(null);
    setPayStep(MoneyPaymentFlowStep.FORM);
    setIsPaymentOpen(false);
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="credit-card-actions"
    >
      {errorCode && payStep === MoneyPaymentFlowStep.FORM ? (
        <StatusAlert
          variant="danger"
          title={t("actionErrorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      {leadMonth ? (
        <CreditCardDueLead
          leadMonth={leadMonth}
          remainingDueLabel={formatMoney(remainingDue)}
          statementLabel={formatMoney(leadMonth.statementAmount)}
          paidLabel={formatMoney(leadMonth.paidAmount)}
          paymentProgress={paymentProgress}
        />
      ) : (
        <EmptyState
          title={t("noCurrentStatement")}
          icon={
            <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.DISPLAY} />
          }
          className="flex-none py-(--space-4)"
        />
      )}
      <CreditCardInstallmentsSection
        cardAccountId={card.accountId}
        installments={installments}
        eligiblePurchases={eligiblePurchases}
        currency={currency}
        canMutate={canMutate}
      />
      <CreditCardActivitySection
        items={activityItems}
        formatMoney={formatMoney}
      />
      {canMutate ? (
        <BottomActionBar>
          <Button
            variant="primary"
            className="w-full"
            data-testid="card-payment-open"
            isDisabled={!canPay}
            onPress={() => {
              setErrorCode(null);
              setIsPaymentOpen(true);
            }}
          >
            {t("settleTitle")}
          </Button>
          {!canPay ? (
            <Text size="sm" tone="secondary">
              {t("paymentUnavailable")}
            </Text>
          ) : null}
        </BottomActionBar>
      ) : null}
      <Sheet
        isOpen={isPaymentOpen}
        onOpenChange={(next) => {
          if (!next) closePayment();
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("settleTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          {canPay ? (
            <CreditCardSettleFlow
              key={isPaymentOpen ? "payment-open" : "payment-closed"}
              cardAccountId={card.accountId}
              cardName={card.name}
              outstanding={card.outstanding}
              defaultPaymentAmount={remainingDue}
              liquidAccounts={liquidAccounts}
              linkedBankAccountId={card.linkedBankAccountId}
              formatMoney={formatMoney}
              errorCode={errorCode}
              onError={setErrorCode}
              payStep={payStep}
              onPayStepChange={setPayStep}
              onClose={closePayment}
            />
          ) : null}
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
