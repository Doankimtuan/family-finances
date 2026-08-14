"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  buildDebtPaymentReview,
  type DebtPaymentReview,
} from "@/modules/ledger/application/debt-domain";
import {
  DebtDirection,
  DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
  createDebtIdempotencyKey,
} from "@/modules/ledger/application/ledger-constants";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { Amount } from "@/shared/patterns/amount";
import { AmountField } from "@/shared/patterns/amount-field";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { recordDebtPaymentAction } from "../../money-products-actions";

type AccountOption = { id: string; name: string };
type DebtPaymentSheetProps = {
  debtId: string;
  direction: DebtDirection;
  remainingAmount: number;
  currency: string;
  locale: string;
  accounts: AccountOption[];
  today: string;
};

export function DebtPaymentSheet({
  debtId,
  direction,
  remainingAmount,
  currency,
  locale,
  accounts,
  today,
}: DebtPaymentSheetProps) {
  const t = useTranslations("money.debtDetail");
  const tErrors = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [amount, setAmount] = useState<number | null>(remainingAmount);
  const [accountId, setAccountId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<
    ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE | null
  >(null);
  const [isPending, startTransition] = useTransition();
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
  const reviewLabel = isBorrowed ? t("reviewRepayment") : t("reviewReceipt");
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

  function reset() {
    setIsConfirming(false);
    setAmount(remainingAmount);
    setAccountId("");
    setEffectiveDate(today);
    setNote("");
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

  function review() {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (
      amount == null ||
      amount <= 0 ||
      amount > remainingAmount ||
      !accountId
    ) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    setErrorCode(null);
    setIsConfirming(true);
  }

  function confirm() {
    if (amount == null) return;
    startTransition(async () => {
      const result = await recordDebtPaymentAction({
        debtId,
        accountId,
        amount,
        effectiveDate,
        note: note.trim() || undefined,
        idempotencyKey: createDebtIdempotencyKey(
          DEBT_PAYMENT_IDEMPOTENCY_KEY_PREFIX,
        ),
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        close();
        router.refresh();
        return;
      }
      setErrorCode(result.code);
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
      <SheetContent>
        <Sheet.Header>
          <Sheet.Heading>{actionLabel}</Sheet.Heading>
        </Sheet.Header>
        <Sheet.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
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
                amountLabel={formatCurrency(remainingAmount, currency, locale)}
              />
              <AmountField
                id="debt-payment-amount"
                label={paymentAmountLabel}
                value={amount}
                onValueChange={setAmount}
                required
              />
              <LabeledSelect
                label={isBorrowed ? t("payFrom") : t("receiveInto")}
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                options={accounts.map((account) => ({
                  id: account.id,
                  label: account.name,
                }))}
              />
              <LabeledDateInput
                label={paymentDateLabel}
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
              />
              <TextField
                id="debt-payment-note"
                label={t("note")}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </>
          )}
        </Sheet.Body>
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
          isDisabled={!online}
          isPending={isPending}
          onSecondary={() => (isConfirming ? setIsConfirming(false) : close())}
          onPrimary={isConfirming ? confirm : review}
        />
      </SheetContent>
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
            value: formatDate(
              new Date(`${effectiveDate}T00:00:00Z`),
              locale,
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              },
            ),
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
