"use client";

import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type { LedgerTransaction } from "@/modules/ledger/application/client";
import { AmountField } from "@/shared/patterns/amount-field";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LEDGER_ACTION_ERROR_CODE } from "@/modules/ledger/application/client";
import { refundTransactionAction } from "../../mutate-actions";
import { TransactionReceipt } from "../../transaction-receipt";

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
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const noteId = useId();
  const [amount, setAmount] = useState<number | null>(maxRefundable);
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<RefundFormError | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [receipt, setReceipt] = useState<{
    refundTransactionId: string;
    capacityRestored?: number;
  } | null>(null);

  const formattedAmount =
    amount != null && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : null;

  const validate = () => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return false;
    }
    if (amount == null || amount <= 0 || amount > maxRefundable) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return false;
    }
    return true;
  };

  const runRefund = () => {
    setErrorCode(null);
    if (!validate()) return;

    startTransition(async () => {
      const result = await refundTransactionAction({
        originalTransactionId: transaction.id,
        amount: amount!,
        accountId: transaction.accountId,
        note: note.trim() || undefined,
      });
      if (result.status === "success") {
        setReceipt({
          refundTransactionId: result.refundTransactionId ?? transaction.id,
          capacityRestored: result.capacityRestored,
        });
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

  if (receipt) {
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        rows={[
          { id: "amount", label: t("receipt.amount"), value: formattedAmount },
          {
            id: "destination",
            label: t("receipt.destination"),
            value: localizeCatalogName(tCatalog, "accounts", transaction.accountName) || "—",
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: transaction.transactionDate,
          },
          {
            id: "original",
            label: t("receipt.original"),
            value:
              formatCurrency(transaction.amount, currency, locale, {
                maximumFractionDigits: 0,
              }) || "—",
          },
          {
            id: "linked",
            label: t("receipt.linkedRefund"),
            value: receipt.refundTransactionId.slice(0, 8),
          },
          ...(typeof receipt.capacityRestored === "number"
            ? [
                {
                  id: "capacity",
                  label: t("receipt.capacityRestored"),
                  value: formatCurrency(receipt.capacityRestored, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                },
              ]
            : []),
        ]}
        nextActions={[
          {
            id: "view-refund",
            label: t("receipt.viewRefund"),
            href: moneyTransactionPath(receipt.refundTransactionId),
            variant: "primary",
          },
          {
            id: "view-original",
            label: t("receipt.viewOriginal"),
            href: moneyTransactionPath(transaction.id),
            variant: "secondary",
          },
          {
            id: "activity",
            label: t("receipt.backToActivity"),
            href: APP_PATH.MONEY_TRANSACTIONS,
            variant: "secondary",
          },
        ]}
      >
        <div className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)">
          <Text size="sm" tone="secondary">
            {t("confirmBody")}
          </Text>
        </div>
      </TransactionReceipt>
    );
  }

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

      {confirm ? (
        <div className="flex flex-col gap-(--space-3) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
          <Text size="sm" weight="medium" className="text-text-primary">
            {t("confirmTitle")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("confirmBody")}
          </Text>
          <Button
            variant="primary"
            className="w-full"
            data-testid="refund-confirm"
            isDisabled={isPending || !online}
            onPress={runRefund}
          >
            {isPending ? t("saving") : t("confirmYes")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            isDisabled={isPending}
            onPress={() => setConfirm(false)}
          >
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          data-testid="refund-submit"
          isDisabled={isPending || !online}
          onPress={() => {
            if (validate()) setConfirm(true);
          }}
        >
          {t("submit")}
        </Button>
      )}

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
