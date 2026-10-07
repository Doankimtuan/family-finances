"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { CreditCardDetail } from "@/modules/ledger/application/client";
import {
  MoneyCaptureMode,
  MoneyPaymentFlowStep,
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CAPTURE_MODE_QUERY_PARAM,
} from "@/modules/ledger/application/client";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { formatCurrency } from "@/shared/i18n/formatters";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { CreditCardSettleFlow } from "./credit-card-settle-flow";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type LiquidOption = { id: string; name: string };

type CreditCardDetailActionsProps = {
  card: CreditCardDetail;
  liquidAccountsPromise: Promise<LiquidOption[] | null>;
  currency: string;
  remainingDue: number;
  canMutate?: boolean;
};

type CreditCardChargeActionProps = {
  cardAccountId: string;
  canMutate?: boolean;
};

export function CreditCardChargeAction({
  cardAccountId,
  canMutate = true,
}: CreditCardChargeActionProps) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <Button
      variant="secondary"
      className="h-auto min-h-12 w-full flex-col gap-(--space-1) px-(--space-2) py-(--space-1)"
      isDisabled={!online || !canMutate}
      onPress={() => {
        const params = new URLSearchParams({
          [TRANSACTION_ACCOUNT_QUERY_PARAM]: cardAccountId,
          [TRANSACTION_CAPTURE_MODE_QUERY_PARAM]: MoneyCaptureMode.EXPENSE,
        });
        router.push(`${APP_PATH.MONEY_ADD}?${params.toString()}`);
      }}
      data-testid="card-charge-open"
    >
      <AppIcon icon={FINANCE_ICONS.card} size={AppIconSize.SM} />
      <span className="text-xs">{t("actionCharge")}</span>
    </Button>
  );
}

/**
 * Decision layer for credit cards. It keeps the overview focused on the open
 * statement, defers mutation forms to a sheet, and retains existing ledger flows.
 */
export function CreditCardDetailActions({
  card,
  liquidAccountsPromise,
  currency,
  remainingDue,
  canMutate = true,
}: CreditCardDetailActionsProps) {
  const liquidAccounts = use(liquidAccountsPromise);
  const t = useTranslations("money.creditCard");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [payStep, setPayStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const formatMoney = (amount: number) =>
    formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });
  const canPay =
    card.outstanding > 0 && Boolean(liquidAccounts?.length) && online;

  const closePayment = () => {
    setErrorCode(null);
    setPayStep(MoneyPaymentFlowStep.FORM);
    setIsPaymentOpen(false);
  };

  return (
    <>
      <span hidden data-testid="card-payment-actions-ready" />
      {errorCode && payStep === MoneyPaymentFlowStep.FORM ? (
        <StatusAlert
          variant="danger"
          title={t("actionErrorTitle")}
          description={t(`errors.${errorCode}`)}
          className="col-span-full"
        />
      ) : null}
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
          {canPay && liquidAccounts ? (
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
    </>
  );
}
