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
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
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
  liquidAccounts: LiquidOption[];
  linkedBankAccountId: string | null;
  formatMoney: (amount: number) => string;
  onError: (code: ErrorCode | null) => void;
  errorCode: ErrorCode | null;
  payStep: MoneyPaymentFlowStep;
  onPayStepChange: (step: MoneyPaymentFlowStep) => void;
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
  liquidAccounts,
  linkedBankAccountId,
  formatMoney,
  onError,
  errorCode,
  payStep,
  onPayStepChange,
}: Props) {
  const t = useTranslations("money.creditCard");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [settleAmount, setSettleAmount] = useState<number | null>(
    outstanding > 0 ? outstanding : null,
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
            value: formatMoney(Math.abs(receipt.sourceDelta)),
          },
          {
            id: "remaining",
            label: t("receipt.remainingDue"),
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
    );
  }

  if (payStep === MoneyPaymentFlowStep.CONFIRM) {
    const amount = settleAmount ?? 0;
    const remainingAfter = Math.max(0, outstanding - amount);
    return (
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
              value: formatMoney(remainingAfter),
            },
            {
              id: "application",
              label: t("confirm.application"),
              value: t("confirm.fifoOrder"),
            },
          ]}
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid="card-settle-confirm"
          isDisabled={isPending || !online}
          onPress={confirmPay}
        >
          {isPending ? t("settling") : t("confirm.submit")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          data-testid="card-settle-back"
          isDisabled={isPending}
          onPress={() => onPayStepChange(MoneyPaymentFlowStep.FORM)}
        >
          {t("confirm.back")}
        </Button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-(--space-3)">
      <SectionHeader title={t("settleTitle")} />
      <Text size="sm" tone="secondary">
        {t("settleLiabilityHint")}
      </Text>
      <AmountField
        id="card-settle-amount"
        label={t("settleAmountLabel")}
        value={settleAmount}
        onValueChange={setSettleAmount}
        data-testid="card-settle-amount"
      />
      <LabeledSelect
        label={t("settleSourceLabel")}
        value={sourceId}
        onChange={(event) => setSourceId(event.target.value)}
        data-testid="card-settle-source"
        options={liquidAccounts.map((account) => ({
          id: account.id,
          label: account.name,
        }))}
      />
      <LabeledDateInput
        label={t("settleDateLabel")}
        value={effectiveDate}
        onChange={(event) => setEffectiveDate(event.target.value)}
        data-testid="card-settle-date"
      />
      <Button
        variant="primary"
        className="w-full"
        data-testid="card-settle-submit"
        isDisabled={isPending || !online || !sourceId}
        onPress={goConfirm}
      >
        {t("settlePreview")}
      </Button>
    </section>
  );
}
