"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  buildDebtPaymentReview,
  type DebtPaymentReview,
} from "@/modules/ledger/application/debt-domain";
import {
  DebtDirection,
  DEBT_HALF_PAYMENT_PERCENT,
  DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
  MoneyPaymentFlowStep,
  createDebtIdempotencyKey,
} from "@/modules/ledger/application/ledger-constants";
import {
  recordDebtPaymentFormSchema,
  type RecordDebtPaymentFormValues,
} from "@/modules/ledger/application/commands/debt.schemas";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { MotionStep } from "@/shared/motion";
import { Amount } from "@/shared/patterns/amount";
import { AmountField } from "@/shared/patterns/amount-field";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { TransactionReceipt } from "../../transactions/transaction-receipt";
import { DatePickerField, SelectField } from "@/shared/ui/form";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { recordDebtPaymentAction } from "../../money-products-actions";

type AccountOption = { id: string; name: string; balance: number };
type DebtPaymentSheetProps = {
  debtId: string;
  direction: DebtDirection;
  remainingAmount: number;
  currency: string;
  locale: string;
  accounts: AccountOption[];
  accountsLoadFailed: boolean;
  today: string;
};

type DebtPaymentReceipt = {
  transactionId: string;
  amount: number;
  accountName: string;
  effectiveDate: string;
  remainingAmount: number;
  completed: boolean;
  idempotentReplay: boolean;
};

export function DebtPaymentSheet({
  debtId,
  direction,
  remainingAmount,
  currency,
  locale,
  accounts,
  accountsLoadFailed,
  today,
}: DebtPaymentSheetProps) {
  const t = useTranslations("money.debtDetail");
  const tErrors = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receipt, setReceipt] = useState<DebtPaymentReceipt | null>(null);
  const [errorCode, setErrorCode] = useState<
    ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<RecordDebtPaymentFormValues>({
    resolver: zodResolver(recordDebtPaymentFormSchema(remainingAmount)),
    defaultValues: {
      amount: remainingAmount,
      accountId: "",
      effectiveDate: today,
      note: "",
    },
  });
  const amount = useWatch({ control, name: "amount" });
  const accountId = useWatch({ control, name: "accountId" });
  const effectiveDate = useWatch({ control, name: "effectiveDate" });
  const isBorrowed = direction === DebtDirection.BORROWED;
  const actionLabel = isBorrowed ? t("repay") : t("receive");
  const remainingContextLabel = isBorrowed
    ? t("remainingToPay")
    : t("remainingToReceive");
  const paymentAmountLabel = isBorrowed
    ? t("repaymentAmount")
    : t("receiptAmount");
  const paymentDateLabel = isBorrowed ? t("repaymentDate") : t("receiptDate");
  const reviewAccountLabel = isBorrowed ? t("reviewFrom") : t("reviewInto");
  const reviewLabel = t("review");
  const confirmLabel = isBorrowed ? t("confirmRepayment") : t("confirmReceipt");
  const confirmTitle = isBorrowed
    ? t("confirmRepaymentTitle")
    : t("confirmReceiptTitle");
  const recordingLabel = isBorrowed
    ? t("recordingRepayment")
    : t("recordingReceipt");
  const selectedAccountName =
    accounts.find((account) => account.id === accountId)?.name ?? "";
  const paymentReview =
    amount == null ? null : buildDebtPaymentReview(remainingAmount, amount);

  function chooseQuickAmount(percentage: number) {
    const quickAmount = Math.min(
      remainingAmount,
      Math.max(1, Math.ceil((remainingAmount * percentage) / 100)),
    );
    setValue("amount", quickAmount, {
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function reset() {
    setIsConfirming(false);
    setReceipt(null);
    resetForm({
      amount: remainingAmount,
      accountId: "",
      effectiveDate: today,
      note: "",
    });
    setErrorCode(null);
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

  const review = handleSubmit(() => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    setErrorCode(null);
    setIsConfirming(true);
  });

  function confirm() {
    const values = getValues();
    startTransition(async () => {
      const result = await recordDebtPaymentAction({
        debtId,
        accountId: values.accountId,
        amount: values.amount,
        effectiveDate: values.effectiveDate,
        note: values.note?.trim() || undefined,
        idempotencyKey: createDebtIdempotencyKey(
          DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
        ),
      });
      if (
        result.status === ProductActionStatus.SUCCESS &&
        result.transactionId &&
        result.amount != null &&
        result.remainingPrincipal != null
      ) {
        setReceipt({
          transactionId: result.transactionId,
          amount: result.amount,
          accountName: selectedAccountName,
          effectiveDate: values.effectiveDate,
          remainingAmount: result.remainingPrincipal,
          completed: result.completed ?? result.remainingPrincipal === 0,
          idempotentReplay: result.idempotentReplay ?? false,
        });
        setIsConfirming(false);
        return;
      }
      setErrorCode(
        result.status === ProductActionStatus.ERROR
          ? result.code
          : PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
      );
      setIsConfirming(false);
    });
  }

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-payment-open"
        isDisabled={!online || remainingAmount <= 0}
        onPress={() => handleOpenChange(true)}
      >
        {actionLabel}
      </Button>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{actionLabel}</Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
          {receipt ? (
            <TransactionReceipt
              title={
                isBorrowed
                  ? t("receipt.repaymentTitle")
                  : t("receipt.receiptTitle")
              }
              outcome={
                receipt.idempotentReplay
                  ? t("receipt.replay")
                  : isBorrowed
                    ? t("receipt.repaymentOutcome")
                    : t("receipt.receiptOutcome")
              }
              rows={[
                {
                  id: "direction",
                  label: t("receipt.direction"),
                  value: isBorrowed
                    ? t("receipt.repaymentDirection")
                    : t("receipt.receiptDirection"),
                  kind: "text",
                },
                {
                  id: "amount",
                  label: paymentAmountLabel,
                  value: formatCurrency(receipt.amount, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                  kind: "financial",
                },
                {
                  id: "account",
                  label: isBorrowed
                    ? t("receipt.source")
                    : t("receipt.destination"),
                  value: receipt.accountName,
                  kind: "text",
                },
                {
                  id: "date",
                  label: paymentDateLabel,
                  value: formatDate(
                    new Date(`${receipt.effectiveDate}T00:00:00Z`),
                    locale,
                    { day: "2-digit", month: "2-digit", year: "numeric" },
                  ),
                  kind: "text",
                },
                {
                  id: "remaining",
                  label: remainingContextLabel,
                  value: formatCurrency(
                    receipt.remainingAmount,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                  kind: "financial",
                },
                ...(receipt.completed
                  ? [
                      {
                        id: "completed",
                        label: t("receipt.status"),
                        value: t("receipt.completed"),
                        kind: "text" as const,
                      },
                    ]
                  : []),
              ]}
              relatedRecordsTitle={t("receipt.relatedTitle")}
              relatedRecords={[
                {
                  id: "transaction",
                  label: t("receipt.viewTransaction"),
                  href: moneyTransactionPath(receipt.transactionId),
                },
              ]}
              nextActions={[
                {
                  id: "done",
                  label: t("receipt.done"),
                  variant: "primary",
                  onPress: finish,
                },
              ]}
            />
          ) : (
            <MotionStep
              stepKey={
                isConfirming
                  ? MoneyPaymentFlowStep.CONFIRM
                  : MoneyPaymentFlowStep.FORM
              }
            >
              {isConfirming ? (
                <PaymentReview
                  title={confirmTitle}
                  hint={t("reviewHint")}
                  amountLabel={paymentAmountLabel}
                  accountLabel={reviewAccountLabel}
                  accountName={selectedAccountName}
                  dateLabel={paymentDateLabel}
                  effectiveDate={effectiveDate}
                  afterLabel={t("afterPayment")}
                  remainingLabel={remainingContextLabel}
                  review={paymentReview}
                  currency={currency}
                  locale={locale}
                />
              ) : (
                <>
                  <Amount
                    size="md"
                    label={remainingContextLabel}
                    amountLabel={formatCurrency(
                      remainingAmount,
                      currency,
                      locale,
                    )}
                  />
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <AmountField
                        id="debt-payment-amount"
                        label={paymentAmountLabel}
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        required
                        error={
                          fieldState.error
                            ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                            : undefined
                        }
                      />
                    )}
                  />
                  <div
                    className="flex flex-wrap gap-(--space-2)"
                    aria-label={t("quickActions")}
                  >
                    <Button
                      variant="tertiary"
                      className="min-h-9 px-(--space-3) text-sm"
                      onPress={() => chooseQuickAmount(100)}
                      data-testid="debt-payment-quick-full"
                    >
                      {isBorrowed ? t("quickRepayAll") : t("quickReceiveAll")}
                    </Button>
                    <Button
                      variant="tertiary"
                      className="min-h-9 px-(--space-3) text-sm"
                      onPress={() =>
                        chooseQuickAmount(DEBT_HALF_PAYMENT_PERCENT)
                      }
                      data-testid="debt-payment-quick-half"
                    >
                      {t("quickHalf")}
                    </Button>
                  </div>
                  {accountsLoadFailed ? (
                    <StatusAlert
                      variant="danger"
                      title={t("accountsLoadError")}
                      description={t("accountsLoadErrorDescription")}
                      action={
                        <Button
                          variant="tertiary"
                          onPress={() => router.refresh()}
                          data-testid="debt-payment-account-retry"
                        >
                          {t("retryAccounts")}
                        </Button>
                      }
                      data-testid="debt-payment-account-load-error"
                    />
                  ) : accounts.length === 0 ? (
                    <StatusAlert
                      variant="warning"
                      title={t("noAccounts")}
                      description={t("noAccountsDescription")}
                      data-testid="debt-payment-account-empty"
                    />
                  ) : (
                    <Controller
                      control={control}
                      name="accountId"
                      render={({ field, fieldState }) => (
                        <SelectField
                          id="debt-payment-account"
                          label={isBorrowed ? t("payFrom") : t("receiveInto")}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder={t("chooseAccount")}
                          options={accounts.map((account) => ({
                            id: account.id,
                            textValue: account.name,
                            label: (
                              <span className="flex min-w-0 flex-1 items-center justify-between gap-(--space-3)">
                                <span className="truncate">{account.name}</span>
                                <span className="shrink-0 text-xs text-text-secondary">
                                  {t("availableBalance")}{" "}
                                  <FinancialValue>
                                    {formatCurrency(
                                      account.balance,
                                      currency,
                                      locale,
                                      { maximumFractionDigits: 0 },
                                    )}
                                  </FinancialValue>
                                </span>
                              </span>
                            ),
                          }))}
                          error={
                            fieldState.error
                              ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                              : undefined
                          }
                        />
                      )}
                    />
                  )}
                  <Controller
                    control={control}
                    name="effectiveDate"
                    render={({ field, fieldState }) => (
                      <DatePickerField
                        id="debt-payment-date"
                        label={paymentDateLabel}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        required
                        error={
                          fieldState.error
                            ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                            : undefined
                        }
                      />
                    )}
                  />
                  <TextField
                    id="debt-payment-note"
                    label={t("note")}
                    registration={register("note")}
                    error={
                      errors.note
                        ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                        : undefined
                    }
                  />
                </>
              )}
            </MotionStep>
          )}
        </ActionSheetLayout.Body>
        {!receipt ? (
          <SheetActionFooter
            secondaryLabel={isConfirming ? t("backToForm") : t("cancel")}
            primaryLabel={
              isPending
                ? recordingLabel
                : isConfirming
                  ? confirmLabel
                  : reviewLabel
            }
            primaryTestId="debt-payment-submit"
            isDisabled={!online || accountsLoadFailed || accounts.length === 0}
            isPending={isPending}
            onSecondary={() =>
              isConfirming ? setIsConfirming(false) : close()
            }
            onPrimary={isConfirming ? confirm : review}
          />
        ) : null}
      </ActionSheetLayout>
    </Sheet>
  );
}

function PaymentReview({
  title,
  hint,
  amountLabel,
  accountLabel,
  accountName,
  dateLabel,
  effectiveDate,
  afterLabel,
  remainingLabel,
  review,
  currency,
  locale,
}: {
  title: string;
  hint: string;
  amountLabel: string;
  accountLabel: string;
  accountName: string;
  dateLabel: string;
  effectiveDate: string;
  afterLabel: string;
  remainingLabel: string;
  review: DebtPaymentReview | null;
  currency: string;
  locale: string;
}) {
  if (!review) return null;
  return (
    <div className="flex flex-col gap-(--space-3)">
      <div>
        <Text size="sm" weight="medium" className="text-text-primary">
          {title}
        </Text>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {hint}
        </Text>
      </div>
      <ConfirmSummary
        rows={[
          {
            id: "amount",
            label: amountLabel,
            value: formatCurrency(review.paymentAmount, currency, locale),
          },
          {
            id: "account",
            label: accountLabel,
            value: accountName,
          },
          {
            id: "date",
            label: dateLabel,
            value: formatDate(new Date(`${effectiveDate}T00:00:00Z`), locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
          },
          {
            id: "after",
            label: afterLabel,
            value: (
              <span className="flex flex-col items-end gap-(--space-1)">
                <span>
                  {formatCurrency(
                    review.remainingAfterPayment,
                    currency,
                    locale,
                  )}
                </span>
                <span className="font-normal text-text-secondary">
                  {remainingLabel}
                </span>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
