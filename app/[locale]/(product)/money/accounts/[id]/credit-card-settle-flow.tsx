"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import {
  MoneyPaymentFlowStep,
  TransactionLedgerType,
  createCardPaymentIdempotencyKey,
} from "@/modules/ledger/application/client";
import { AmountField } from "@/shared/patterns/amount-field";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { DatePickerField, SelectField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { settleCardAction } from "../actions";
import { TransactionReceipt } from "../../transactions/transaction-receipt";
import { todayIsoDate } from "@/shared/utils/iso-date";

type ErrorCode =
  | ProductActionErrorCode
  | LedgerActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type LiquidOption = { id: string; name: string };

type Props = {
  cardAccountId: string;
  cardName: string;
  outstanding: number;
  defaultPaymentAmount: number;
  liquidAccounts: LiquidOption[];
  linkedBankAccountId: string | null;
  formatMoney: (amount: number) => string;
  onError: (code: ErrorCode | null) => void;
  errorCode: ErrorCode | null;
  payStep: MoneyPaymentFlowStep;
  onPayStepChange: (step: MoneyPaymentFlowStep) => void;
  onClose: () => void;
};

type ReceiptState = {
  transactionId: string;
  paymentId: string;
  amount: number;
  sourceName: string;
  remainingDue: number;
  sourceDelta: number;
  effectiveDate: string;
};

export function CreditCardSettleFlow({
  cardAccountId,
  cardName,
  outstanding,
  defaultPaymentAmount,
  liquidAccounts,
  linkedBankAccountId,
  formatMoney,
  onError,
  errorCode,
  payStep,
  onPayStepChange,
  onClose,
}: Props) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [settleAmount, setSettleAmount] = useState<number | null>(() =>
    getInitialPaymentAmount(defaultPaymentAmount, outstanding),
  );
  const [sourceId, setSourceId] = useState(
    linkedBankAccountId ?? liquidAccounts[0]?.id ?? "",
  );
  const [effectiveDate, setEffectiveDate] = useState(todayIsoDate);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);

  const sourceName =
    liquidAccounts.find((account) => account.id === sourceId)?.name ?? sourceId;

  const goConfirm = () => {
    onError(null);
    if (!online) {
      onError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    const amount = settleAmount ?? 0;
    if (amount <= 0 || amount > outstanding || !sourceId) {
      onError(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    setIdempotencyKey(createCardPaymentIdempotencyKey());
    onPayStepChange(MoneyPaymentFlowStep.CONFIRM);
  };

  const confirmPay = () => {
    onError(null);
    if (!online) {
      onError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    const amount = settleAmount ?? 0;
    if (amount <= 0 || !sourceId || !idempotencyKey) {
      onError(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    startTransition(async () => {
      const result = await settleCardAction({
        cardAccountId,
        sourceAccountId: sourceId,
        amount,
        effectiveDate,
        idempotencyKey,
      });
      if (
        result.status === ProductActionStatus.SUCCESS &&
        result.transactionId &&
        result.paymentId
      ) {
        setReceipt({
          transactionId: result.transactionId,
          paymentId: result.paymentId,
          amount,
          sourceName,
          remainingDue: result.remainingDue ?? 0,
          sourceDelta: result.sourceDelta ?? -amount,
          effectiveDate,
        });
        onPayStepChange(MoneyPaymentFlowStep.RECEIPT);
        return;
      }
      if (result.status === ProductActionStatus.ERROR) {
        onError(result.code);
      } else {
        onError(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
      }
    });
  };

  if (payStep === MoneyPaymentFlowStep.RECEIPT && receipt) {
    return (
      <ActionSheetLayout.Body>
        <TransactionReceipt
          title={t("receipt.title")}
          outcome={t("receipt.outcome")}
          rows={[
            {
              id: "kind",
              label: t("receipt.kindLabel"),
              value: t("receipt.kindValue"),
            },
            {
              id: "amount",
              label: t("receipt.amount"),
              financial: true,
              value: formatMoney(receipt.amount),
            },
            {
              id: "source",
              label: t("receipt.source"),
              value: receipt.sourceName,
            },
            {
              id: "card",
              label: t("receipt.card"),
              value: cardName,
            },
            {
              id: "date",
              label: t("receipt.date"),
              value: receipt.effectiveDate,
            },
            {
              id: "sourceDelta",
              label: t("receipt.sourceDelta"),
              financial: true,
              value: formatMoney(Math.abs(receipt.sourceDelta)),
            },
            {
              id: "remaining",
              label: t("receipt.remainingDue"),
              financial: true,
              value: formatMoney(receipt.remainingDue),
            },
            {
              id: "direction",
              label: t("receipt.notIncomeExpense"),
              value: TransactionLedgerType.LIABILITY_PAYMENT,
            },
          ]}
          relatedRecordsTitle={t("receipt.relatedTitle")}
          relatedRecords={[
            {
              id: "tx",
              label: t("receipt.viewTransaction"),
              href: moneyTransactionPath(receipt.transactionId),
            },
            {
              id: "payment",
              label: t("receipt.paymentRecord", {
                id: receipt.paymentId.slice(0, 8),
              }),
            },
          ]}
          nextActions={[
            {
              id: "back",
              label: t("receipt.done"),
              variant: "primary",
              onPress: () => {
                router.refresh();
              },
            },
          ]}
        />
      </ActionSheetLayout.Body>
    );
  }

  if (payStep === MoneyPaymentFlowStep.CONFIRM) {
    const amount = settleAmount ?? 0;
    const remainingAfter = Math.max(0, outstanding - amount);
    return (
      <>
        <ActionSheetLayout.Body>
          <div
            className="flex flex-col gap-(--space-4)"
            data-testid="card-pay-confirm"
          >
            {errorCode ? (
              <StatusAlert
                variant="danger"
                title={t("actionErrorTitle")}
                description={t(`errors.${errorCode}`)}
              />
            ) : null}
            <StatusAlert
              variant="info"
              title={t("confirm.title")}
              description={t("confirm.liabilityHint")}
            />
            <ConfirmSummary
              rows={[
                {
                  id: "amount",
                  label: t("confirm.amount"),
                  financial: true,
                  value: formatMoney(amount),
                },
                {
                  id: "source",
                  label: t("confirm.source"),
                  value: sourceName,
                },
                {
                  id: "card",
                  label: t("confirm.card"),
                  value: cardName,
                },
                {
                  id: "date",
                  label: t("confirm.date"),
                  value: effectiveDate,
                },
                {
                  id: "remaining",
                  label: t("confirm.remainingAfter"),
                  financial: true,
                  value: formatMoney(remainingAfter),
                },
                {
                  id: "application",
                  label: t("confirm.application"),
                  value: t("confirm.fifoOrder"),
                },
              ]}
            />
          </div>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("confirm.back")}
          primaryLabel={isPending ? t("settling") : t("confirm.submit")}
          primaryTestId="card-settle-confirm"
          isPrimaryDisabled={!online}
          isPending={isPending}
          onSecondary={() => onPayStepChange(MoneyPaymentFlowStep.FORM)}
          onPrimary={confirmPay}
        />
      </>
    );
  }

  return (
    <>
      <ActionSheetLayout.Body>
        <section className="flex flex-col gap-(--space-3)">
          <AmountField
            id="card-settle-amount"
            label={t("settleAmountLabel")}
            description={t("settleAmountDescription")}
            value={settleAmount}
            onValueChange={setSettleAmount}
            data-testid="card-settle-amount"
          />
          <SelectField
            id="card-settle-source"
            label={t("settleSourceLabel")}
            description={t("settleLiabilityHint")}
            value={sourceId}
            onChange={setSourceId}
            options={liquidAccounts.map((account) => ({
              id: account.id,
              label: account.name,
            }))}
            required
            data-testid="card-settle-source"
          />
          <DatePickerField
            id="card-settle-date"
            label={t("settleDateLabel")}
            value={effectiveDate}
            onChange={setEffectiveDate}
            required
            data-testid="card-settle-date"
          />
        </section>
      </ActionSheetLayout.Body>
      <SheetActionFooter
        secondaryLabel={t("cancel")}
        primaryLabel={t("settlePreview")}
        primaryTestId="card-settle-submit"
        isPrimaryDisabled={!online || !sourceId}
        isPending={isPending}
        onSecondary={onClose}
        onPrimary={goConfirm}
      />
    </>
  );
}

function getInitialPaymentAmount(
  defaultPaymentAmount: number,
  outstanding: number,
) {
  if (defaultPaymentAmount > 0) return defaultPaymentAmount;
  if (outstanding > 0) return outstanding;
  return null;
}
