"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type { LedgerTransaction } from "@/modules/ledger/application/client";
import { AmountField } from "@/shared/patterns/amount-field";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LEDGER_ACTION_ERROR_CODE } from "@/modules/ledger/application/client";
import { refundTransactionAction } from "../../mutate-actions";

type RefundFormError =
  | ProductActionErrorCode
  | ClientActionErrorCode
  | typeof LEDGER_ACTION_ERROR_CODE.REFUND_INVALID;

type Props = {
  transaction: LedgerTransaction;
  currency: string;
  maxRefundable: number;
};

/**
 * Link a refund to the original expense and restore jar capacity (BR-02).
 */
export function RefundTransactionForm({
  transaction,
  currency,
  maxRefundable,
}: Props) {
  const t = useTranslations("money.refundForm");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const noteId = useId();
  const [amount, setAmount] = useState<number | null>(maxRefundable);
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<RefundFormError | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (amount == null || amount <= 0 || amount > maxRefundable) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    startTransition(async () => {
      const result = await refundTransactionAction({
        originalTransactionId: transaction.id,
        amount,
        accountId: transaction.accountId,
        note: note.trim() || undefined,
      });
      if (result.status === "success") {
        router.replace(moneyTransactionPath(transaction.id));
        router.refresh();
        return;
      }
      if (
        result.code === LEDGER_ACTION_ERROR_CODE.REFUND_INVALID ||
        result.code === PRODUCT_ACTION_ERROR_CODE.INVALID ||
        result.code === PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED ||
        result.code === PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP ||
        result.code === PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED ||
        result.code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        setErrorCode(result.code);
        return;
      }
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="money-refund-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("title")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <StatusAlert
        variant="info"
        title={t("linkHintTitle")}
        description={t("linkHintBody", {
          max: maxRefundable,
          currency,
        })}
      />
      <AmountField
        id={amountId}
        label={t("amountLabel")}
        description={t("amountHint", { currency })}
        value={amount}
        onValueChange={setAmount}
      />
      <TextField
        id={noteId}
        label={t("noteLabel")}
        placeholder={t("notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        variant="primary"
        className="w-full"
        data-testid="refund-submit"
        isDisabled={isPending || !online}
        onPress={onSubmit}
      >
        {isPending ? t("saving") : t("submit")}
      </Button>
      <Link
        href={moneyTransactionPath(transaction.id)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary"
      >
        {t("cancel")}
      </Link>
      <Link
        href={APP_PATH.MONEY_TRANSACTIONS}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm text-text-secondary"
      >
        {t("back")}
      </Link>
    </div>
  );
}
