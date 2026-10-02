"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type {
  CreditCardDetail,
  CreditCardInstallment,
} from "@/modules/ledger/application/client";
import {
  CardBillingItemType,
  CardBillingMonthStatus,
  MoneyCaptureMode,
  MoneyPaymentFlowStep,
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CAPTURE_MODE_QUERY_PARAM,
} from "@/modules/ledger/application/client";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { formatCurrency } from "@/shared/i18n/formatters";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { InlineAlert, InlineAlertVariant } from "@/shared/ui/inline-alert";
import { StatusAlert } from "@/shared/ui/status-alert";
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
  const router = useRouter();
  const { online } = useOnlineStatusClient();
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
  const activityItems = card.items.filter(
    (item) => item.itemType === CardBillingItemType.STANDARD,
  );
  const canPay = card.outstanding > 0 && liquidAccounts.length > 0 && online;
  const linkedPaymentAccount = liquidAccounts.find(
    (account) => account.id === card.linkedBankAccountId,
  )?.name;

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
          linkedPaymentAccount={linkedPaymentAccount}
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
      <div
        className="grid grid-cols-3 gap-(--space-2)"
        role="group"
        aria-label={t("quickActions")}
        data-testid="credit-card-quick-actions"
      >
        <Button
          variant="primary"
          className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
          data-testid="card-payment-open"
          isDisabled={!canPay || !canMutate}
          onPress={() => {
            setErrorCode(null);
            setIsPaymentOpen(true);
          }}
        >
          <AppIcon icon={FINANCE_ICONS.debt} size={AppIconSize.SM} />
          <span className="text-xs">{t("actionPay")}</span>
        </Button>
        <Button
          variant="secondary"
          className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
          isDisabled={!online || !canMutate}
          onPress={() => {
            const params = new URLSearchParams({
              [TRANSACTION_ACCOUNT_QUERY_PARAM]: card.accountId,
              [TRANSACTION_CAPTURE_MODE_QUERY_PARAM]: MoneyCaptureMode.EXPENSE,
            });
            router.push(`${APP_PATH.MONEY_ADD}?${params.toString()}`);
          }}
          data-testid="card-charge-open"
        >
          <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.SM} />
          <span className="text-xs">{t("actionCharge")}</span>
        </Button>
        <CreditCardInstallmentsSection
          cardAccountId={card.accountId}
          installments={installments}
          eligiblePurchases={eligiblePurchases}
          currency={currency}
          canMutate={canMutate}
          presentation="quick-action"
        />
      </div>
      <CreditCardActivitySection
        accountId={card.accountId}
        items={activityItems}
        formatMoney={formatMoney}
      />
      <InlineAlert
        variant={InlineAlertVariant.INFO}
        description={t("ledgerReminder")}
      />
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
