"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  inboxItemPath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import {
  LoanPaymentMode,
  MoneyPaymentFlowStep,
} from "@/modules/ledger/application/client";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { recordLoanPaymentAction } from "../../money-products-actions";
import { TransactionReceipt } from "../../transactions/transaction-receipt";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DatePickerField, SelectField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type AccountOption = { id: string; name: string };

type Props = {
  loanId: string;
  loanName: string;
  currency: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  remainingPrincipal: number;
  accounts: AccountOption[];
  paidAtDefault: string;
};

type ReceiptState = {
  transactionIds: readonly string[];
  paymentId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  sourceDelta: number;
  remainingPrincipal: number;
  sourceName: string;
  completed?: boolean;
  idempotentReplay?: boolean;
  inboxItemId?: string;
};

export function LoanPayAction({
  loanId,
  loanName,
  currency,
  principalDue,
  interestDue,
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

  const [isOpen, setIsOpen] = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [paidAt, setPaidAt] = useState(paidAtDefault);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const money = (amount: number) =>
    formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });

  const sourceName =
    accounts.find((account) => account.id === accountId)?.name ?? accountId;
  const remainingAfter = Math.max(0, remainingPrincipal - principalDue);
  const isConfirming = step === MoneyPaymentFlowStep.CONFIRM;
  const showReceipt = step === MoneyPaymentFlowStep.RECEIPT && receipt;

  function reset() {
    setAccountId(accounts[0]?.id ?? "");
    setPaidAt(paidAtDefault);
    setErrorCode(null);
    setStep(MoneyPaymentFlowStep.FORM);
    setReceipt(null);
    setIdempotencyKey(null);
  }

  function handleOpenChange(next: boolean) {
    reset();
    setIsOpen(next);
  }

  function close() {
    reset();
    setIsOpen(false);
  }

  function finish() {
    close();
    router.refresh();
  }

  function preview() {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!accountId || !paidAt) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    setErrorCode(null);
    setStep(MoneyPaymentFlowStep.CONFIRM);
  }

  function confirm() {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!accountId || !paidAt) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    const paymentKey = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(paymentKey);

    startTransition(async () => {
      const result = await recordLoanPaymentAction({
        loanId,
        accountId,
        idempotencyKey: paymentKey,
        mode: LoanPaymentMode.SCHEDULED,
        paidAt,
      });

      if (
        result.status === ProductActionStatus.SUCCESS &&
        result.transactionId &&
        result.paymentId
      ) {
        setReceipt({
          transactionIds: result.transactionIds?.length
            ? result.transactionIds
            : [result.transactionId],
          paymentId: result.paymentId,
          amount: result.amount ?? totalDue,
          principalPaid: result.principalPaid ?? principalDue,
          interestPaid: result.interestPaid ?? interestDue,
          sourceDelta: result.sourceDelta ?? -totalDue,
          remainingPrincipal: result.remainingPrincipal ?? remainingAfter,
          sourceName,
          completed: result.completed,
          inboxItemId: result.inboxItemId,
          idempotentReplay: result.idempotentReplay,
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
  }

  const primaryLabel = isPending
    ? t("recording")
    : isConfirming
      ? t("confirm.submit")
      : t("previewPayment");

  const secondaryLabel = isConfirming ? t("confirm.back") : t("cancel");

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="loan-pay-open"
        isDisabled={!online}
        onPress={() => handleOpenChange(true)}
      >
        {t("nextPaymentAction")}
      </Button>

      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{t("nextPaymentAction")}</Sheet.Heading>
        </ActionSheetLayout.Header>

        <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErr(errorCode)} />
          ) : null}

          {showReceipt && receipt ? (
            <TransactionReceipt
              title={t("receipt.title")}
              outcome={t(
                receipt.idempotentReplay
                  ? "receipt.replayOutcome"
                  : "receipt.outcome",
              )}
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
                  id: "source",
                  label: t("receipt.source"),
                  value: receipt.sourceName,
                  kind: "text",
                },
                {
                  id: "loan",
                  label: t("receipt.loan"),
                  value: loanName,
                  kind: "text",
                },
                {
                  id: "date",
                  label: t("receipt.date"),
                  value: paidAt,
                  kind: "text",
                },
                {
                  id: "remaining",
                  label: t("receipt.remainingPrincipal"),
                  value: money(receipt.remainingPrincipal),
                },
              ]}
              relatedRecordsTitle={t("receipt.relatedTitle")}
              relatedRecords={[
                ...receipt.transactionIds.map((transactionId, index) => ({
                  id: `tx-${transactionId}`,
                  label: t("receipt.viewTransaction", { index: index + 1 }),
                  href: moneyTransactionPath(transactionId),
                })),
                {
                  id: `payment-${receipt.paymentId}`,
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
                      onPress: finish,
                    },
                {
                  id: "completion",
                  label: receipt.completed
                    ? t("receipt.completed")
                    : t("receipt.recorded"),
                },
              ]}
            />
          ) : null}

          {!showReceipt && isConfirming ? (
            <div
              className="flex flex-col gap-(--space-4)"
              data-testid="loan-pay-confirm"
            >
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
                    id: "source",
                    label: t("confirm.source"),
                    value: sourceName,
                    kind: "text",
                  },
                  {
                    id: "date",
                    label: t("confirm.date"),
                    value: paidAt,
                    kind: "text",
                  },
                  {
                    id: "remaining",
                    label: t("confirm.remainingAfter"),
                    value: money(remainingAfter),
                  },
                ]}
              />
            </div>
          ) : null}

          {!showReceipt && !isConfirming ? (
            <div
              className="flex flex-col gap-(--space-4)"
              data-testid="loan-pay"
            >
              <Amount
                size={AmountSize.MD}
                label={t("remainingLabel")}
                amountLabel={money(remainingPrincipal)}
              />

              {accounts.length === 0 ? (
                <StatusAlert
                  variant="warning"
                  title={t("noAccounts")}
                  data-testid="loan-pay-account-empty"
                />
              ) : (
                <SelectField
                  id="loan-pay-account"
                  label={t("accountLabel")}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder={t("chooseAccount")}
                  options={accounts.map((account) => ({
                    id: account.id,
                    label: account.name,
                    textValue: account.name,
                  }))}
                  data-testid="loan-pay-account"
                />
              )}

              <DatePickerField
                id="loan-pay-date"
                label={t("dateLabel")}
                value={paidAt}
                onChange={setPaidAt}
                required
                data-testid="loan-pay-date"
              />

              <div
                className="flex flex-col gap-(--space-1) rounded-md border border-border-subtle bg-surface p-(--space-3)"
                data-testid="loan-pay-amount-preview"
              >
                <Text size="sm" tone="secondary">
                  <FinancialValue>
                    {t("amountPreview", { amount: money(totalDue) })}
                  </FinancialValue>
                </Text>
                <Text size="sm" tone="secondary">
                  <FinancialValue>
                    {t("splitPreview", {
                      principal: money(principalDue),
                      interest: money(interestDue),
                    })}
                  </FinancialValue>
                </Text>
              </div>
            </div>
          ) : null}
        </ActionSheetLayout.Body>

        {!showReceipt ? (
          <SheetActionFooter
            secondaryLabel={secondaryLabel}
            primaryLabel={primaryLabel}
            primaryTestId={isConfirming ? "loan-pay-cta" : "loan-pay-preview"}
            isPrimaryDisabled={
              !online || accounts.length === 0 || !accountId || !paidAt
            }
            isPending={isPending}
            onSecondary={() => {
              if (isConfirming) {
                setStep(MoneyPaymentFlowStep.FORM);
                return;
              }
              close();
            }}
            onPrimary={isConfirming ? confirm : preview}
          />
        ) : null}
      </ActionSheetLayout>
    </Sheet>
  );
}
