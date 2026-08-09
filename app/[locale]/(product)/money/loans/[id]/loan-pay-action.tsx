"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  inboxItemPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  LoanPaymentMode,
  MoneyPaymentFlowStep,
} from "@/modules/ledger/application/client";
import { recordLoanPaymentAction } from "../../money-products-actions";
import { TransactionReceipt } from "../../transactions/transaction-receipt";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type AccountOption = { id: string; name: string };

type Props = {
  loanId: string;
  loanName: string;
  currency: string;
  principalDue: number;
  interestDue: number;
  feeDue: number;
  totalDue: number;
  remainingPrincipal: number;
  accounts: AccountOption[];
  paidAtDefault: string;
};

type ReceiptState = {
  transactionId: string;
  paymentId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  feePaid: number;
  sourceDelta: number;
  remainingPrincipal: number;
  sourceName: string;
  completed?: boolean;
  inboxItemId?: string;
};

export function LoanPayAction({
  loanId,
  loanName,
  currency,
  principalDue,
  interestDue,
  feeDue,
  totalDue,
  remainingPrincipal,
  accounts,
  paidAtDefault,
}: Props) {
  const t = useTranslations("money.loanDetail");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [paidAt, setPaidAt] = useState(paidAtDefault);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);

  const money = (n: number) =>
    formatCurrency(n, currency, locale, { maximumFractionDigits: 0 });

  const sourceName =
    accounts.find((account) => account.id === accountId)?.name ?? accountId;
  const remainingAfter = Math.max(0, remainingPrincipal - principalDue);

  if (step === MoneyPaymentFlowStep.RECEIPT && receipt) {
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          {
            id: "total",
            label: t("receipt.total"),
            value: money(receipt.amount),
          },
          {
            id: "principal",
            label: t("receipt.principal"),
            value: money(receipt.principalPaid),
          },
          {
            id: "interest",
            label: t("receipt.interest"),
            value: money(receipt.interestPaid),
          },
          {
            id: "fee",
            label: t("receipt.fee"),
            value: money(receipt.feePaid),
          },
          {
            id: "source",
            label: t("receipt.source"),
            value: receipt.sourceName,
          },
          {
            id: "loan",
            label: t("receipt.loan"),
            value: loanName,
          },
          {
            id: "sourceDelta",
            label: t("receipt.sourceDelta"),
            value: money(Math.abs(receipt.sourceDelta)),
          },
          {
            id: "remaining",
            label: t("receipt.remainingPrincipal"),
            value: money(receipt.remainingPrincipal),
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
          receipt.completed && receipt.inboxItemId
            ? {
                id: "inbox",
                label: t("openInbox"),
                variant: "primary" as const,
                href: inboxItemPath(receipt.inboxItemId),
              }
            : {
                id: "done",
                label: t("receipt.done"),
                variant: "primary" as const,
                onPress: () => router.refresh(),
              },
        ]}
      />
    );
  }

  if (step === MoneyPaymentFlowStep.CONFIRM) {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="loan-pay-confirm"
      >
        {errorCode ? (
          <StatusAlert variant="danger" title={tErr(errorCode)} />
        ) : null}
        <StatusAlert
          variant="info"
          title={t("confirm.title")}
          description={t("confirm.repaymentHint")}
        />
        <ConfirmSummary
          rows={[
            {
              id: "total",
              label: t("confirm.total"),
              value: money(totalDue),
            },
            {
              id: "principal",
              label: t("confirm.principal"),
              value: money(principalDue),
            },
            {
              id: "interest",
              label: t("confirm.interest"),
              value: money(interestDue),
            },
            {
              id: "fee",
              label: t("confirm.fee"),
              value: money(feeDue),
            },
            {
              id: "source",
              label: t("confirm.source"),
              value: sourceName,
            },
            {
              id: "date",
              label: t("confirm.date"),
              value: paidAt,
            },
            {
              id: "remaining",
              label: t("confirm.remainingAfter"),
              value: money(remainingAfter),
            },
          ]}
        />
        <Button
          variant="primary"
          className="min-h-11 w-full"
          data-testid="loan-pay-cta"
          isDisabled={!online || isPending || !accountId}
          onPress={() => {
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            if (!accountId) {
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
              return;
            }
            startTransition(async () => {
              const result = await recordLoanPaymentAction({
                loanId,
                accountId,
                mode: LoanPaymentMode.SCHEDULED,
                paidAt,
              });
              if (
                result.status === ProductActionStatus.SUCCESS &&
                result.transactionId &&
                result.paymentId
              ) {
                setReceipt({
                  transactionId: result.transactionId,
                  paymentId: result.paymentId,
                  amount: result.amount ?? totalDue,
                  principalPaid: result.principalPaid ?? principalDue,
                  interestPaid: result.interestPaid ?? interestDue,
                  feePaid: result.feePaid ?? feeDue,
                  sourceDelta: result.sourceDelta ?? -totalDue,
                  remainingPrincipal:
                    result.remainingPrincipal ?? remainingAfter,
                  sourceName,
                  completed: result.completed,
                  inboxItemId: result.inboxItemId,
                });
                setStep(MoneyPaymentFlowStep.RECEIPT);
                return;
              }
              if (result.status === ProductActionStatus.ERROR) {
                setErrorCode(result.code);
                return;
              }
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
            });
          }}
        >
          {isPending ? t("recording") : t("confirm.submit")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          data-testid="loan-pay-back"
          isDisabled={isPending}
          onPress={() => setStep(MoneyPaymentFlowStep.FORM)}
        >
          {t("confirm.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="loan-pay">
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <Text size="sm" className="font-medium">
        {t("recordPayment")}
      </Text>
      <LabeledSelect
        label={t("accountLabel")}
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
        data-testid="loan-pay-account"
        options={accounts.map((account) => ({
          id: account.id,
          label: account.name,
        }))}
      />
      <LabeledDateInput
        label={t("dateLabel")}
        value={paidAt}
        onChange={(event) => setPaidAt(event.target.value)}
        data-testid="loan-pay-date"
      />
      <div
        className="flex flex-col gap-(--space-1) rounded-md border border-border-subtle bg-surface p-(--space-3)"
        data-testid="loan-pay-amount-preview"
      >
        <Text size="sm" tone="secondary">
          {t("amountPreview", { amount: money(totalDue) })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("splitPreview", {
            principal: money(principalDue),
            interest: money(interestDue),
            fee: money(feeDue),
          })}
        </Text>
      </div>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="loan-pay-preview"
        isDisabled={!online || isPending || !accountId || accounts.length === 0}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          if (!accountId) {
            setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
            return;
          }
          setErrorCode(null);
          setStep(MoneyPaymentFlowStep.CONFIRM);
        }}
      >
        {t("previewPayment")}
      </Button>
    </div>
  );
}
