"use client";

import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type {
  LedgerAccount,
  LedgerTransaction,
  RefundTransactionInput,
} from "@/modules/ledger/application/client";
import { refundTransactionInputSchema } from "@/modules/ledger/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { TransactionReceipt } from "@/app/[locale]/(product)/money/transactions/transaction-receipt";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
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

type ReceiptState = {
  refundTransactionId: string;
  amount: number;
  accountName: string;
  transactionDate: string;
  capacityRestored?: number;
};

type Props = {
  transaction: LedgerTransaction;
  currency: string;
  maxRefundable: number;
  destinationAccounts: LedgerAccount[];
  defaultTransactionDate: string;
};

function createDefaultValues(
  transaction: LedgerTransaction,
  maxRefundable: number,
  destinationAccountId: string,
  transactionDate: string,
): RefundTransactionInput {
  return {
    originalTransactionId: transaction.id,
    amount: maxRefundable,
    accountId: destinationAccountId,
    transactionDate,
    note: undefined,
  };
}

export function RefundTransactionForm({
  transaction,
  currency,
  maxRefundable,
  destinationAccounts,
  defaultTransactionDate,
}: Props) {
  const t = useTranslations("money.refundForm");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const accountId = useId();
  const dateId = useId();
  const noteId = useId();
  const [errorCode, setErrorCode] = useState<RefundFormError | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const defaultAccount = destinationAccounts[0];
  const form = useForm<RefundTransactionInput>({
    resolver: zodResolver(refundTransactionInputSchema),
    defaultValues: createDefaultValues(
      transaction,
      maxRefundable,
      defaultAccount?.id ?? "",
      defaultTransactionDate,
    ),
  });
  const amount = useWatch({ control: form.control, name: "amount" });
  const selectedAccountId = useWatch({
    control: form.control,
    name: "accountId",
  });
  const transactionDate = useWatch({
    control: form.control,
    name: "transactionDate",
  });
  const selectedAccount = destinationAccounts.find(
    (account) => account.id === selectedAccountId,
  );
  const originalTitle =
    transaction.note ||
    (transaction.categoryName
      ? localizeCatalogName(tCatalog, "tags", transaction.categoryName)
      : "") ||
    t("originalFallback");
  const originalAccountName = transaction.accountName
    ? localizeCatalogName(tCatalog, "accounts", transaction.accountName)
    : t("emptyValue");
  const originalDate = formatDate(
    new Date(`${transaction.transactionDate}T00:00:00Z`),
    locale,
  );
  const refundedSoFar = Math.max(0, transaction.amount - maxRefundable);
  const amountLabel =
    typeof amount === "number" && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : null;
  const maxRefundableLabel = formatCurrency(maxRefundable, currency, locale, {
    maximumFractionDigits: 0,
  });

  const setInvalid = () => {
    setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
  };

  const validateCap = (values: RefundTransactionInput) => {
    if (values.amount > maxRefundable) {
      form.setError("amount", { type: "max" });
      setInvalid();
      return false;
    }
    if (!values.accountId) {
      form.setError("accountId", { type: "required" });
      setInvalid();
      return false;
    }
    return true;
  };

  const reviewRefund = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void form.handleSubmit((values) => {
      if (validateCap(values)) setConfirm(true);
    }, setInvalid)();
  };

  const runRefund = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void form.handleSubmit((values) => {
      if (!validateCap(values)) return;
      startTransition(async () => {
        const result = await refundTransactionAction(values);
        if (result.status === "success") {
          const account = destinationAccounts.find(
            (candidate) => candidate.id === values.accountId,
          );
          setReceipt({
            refundTransactionId: result.refundTransactionId ?? transaction.id,
            amount: values.amount,
            accountName: account
              ? localizeCatalogName(tCatalog, "accounts", account.name)
              : t("emptyValue"),
            transactionDate: values.transactionDate ?? defaultTransactionDate,
            capacityRestored: result.capacityRestored,
          });
          return;
        }
        setErrorCode(
          result.code === LEDGER_ACTION_ERROR_CODE.REFUND_INVALID ||
            result.code === PRODUCT_ACTION_ERROR_CODE.INVALID ||
            result.code === PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED ||
            result.code === PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP ||
            result.code === PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED ||
            result.code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
            ? result.code
            : PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
        );
        setConfirm(false);
      });
    }, setInvalid)();
  };

  if (receipt) {
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        rows={[
          {
            id: "amount",
            label: t("receipt.amount"),
            value: formatCurrency(receipt.amount, currency, locale, {
              maximumFractionDigits: 0,
            }),
          },
          {
            id: "destination",
            label: t("receipt.destination"),
            value: receipt.accountName,
            kind: "text",
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: formatDate(
              new Date(`${receipt.transactionDate}T00:00:00Z`),
              locale,
            ),
            kind: "text",
          },
          {
            id: "original",
            label: t("receipt.original"),
            value: originalTitle,
            kind: "text",
          },
          ...(typeof receipt.capacityRestored === "number"
            ? [
                {
                  id: "capacity",
                  label: t("receipt.capacityRestored"),
                  value: formatCurrency(
                    receipt.capacityRestored,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
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
            id: "done",
            label: t("receipt.done"),
            href: APP_PATH.MONEY_TRANSACTIONS,
            variant: "tertiary",
          },
        ]}
      >
        <div className="rounded-lg border border-border-subtle bg-surface-soft p-(--space-3)">
          <Text size="sm" tone="secondary">
            {t("receipt.relationship")}
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
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      {!online ? (
        <StatusAlert
          variant="warning"
          title={t("errors.offline")}
          description={t("offlineHint")}
        />
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <Text size="lg" weight="semibold">
          {t("originalTitle")}
        </Text>
        <div className="flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface-soft p-(--space-4)">
          <Text size="base" weight="medium">
            {originalTitle}
          </Text>
          <Text size="sm" tone="secondary">
            {transaction.categoryName
              ? `${localizeCatalogName(tCatalog, "tags", transaction.categoryName)} · `
              : ""}
            {originalAccountName}
          </Text>
          <dl className="mt-(--space-2) flex flex-col gap-(--space-2)">
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("originalAmount")}
              </Text>
              <Text size="sm" className="font-medium tabular-nums">
                <FinancialValue>
                  {formatCurrency(transaction.amount, currency, locale, {
                    maximumFractionDigits: 0,
                  })}
                </FinancialValue>
              </Text>
            </div>
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("originalDate")}
              </Text>
              <Text size="sm" className="font-medium tabular-nums">
                {originalDate}
              </Text>
            </div>
            {refundedSoFar > 0 ? (
              <div className="flex justify-between gap-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("refundedSoFar")}
                </Text>
                <Text size="sm" className="font-medium tabular-nums">
                  <FinancialValue>
                    {formatCurrency(refundedSoFar, currency, locale, {
                      maximumFractionDigits: 0,
                    })}
                  </FinancialValue>
                </Text>
              </div>
            ) : null}
            <div className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {t("remainingRefundable")}
              </Text>
              <Text size="sm" className="font-medium tabular-nums">
                <FinancialValue>{maxRefundableLabel}</FinancialValue>
              </Text>
            </div>
          </dl>
        </div>
      </section>

      <ControlledField
        control={form.control}
        field={{
          type: "amount",
          name: "amount",
          id: amountId,
          label: t("amountLabel"),
          description: t("amountHint", { currency }),
          required: true,
          testId: "refund-amount",
        }}
        getErrorMessage={() => t("errors.invalid")}
      />

      <ControlledField
        control={form.control}
        field={{
          type: "select",
          name: "accountId",
          id: accountId,
          label: t("destinationLabel"),
          description: t("destinationHint"),
          required: true,
          testId: "refund-account",
          options: destinationAccounts.map((account) => ({
            id: account.id,
            label: localizeCatalogName(tCatalog, "accounts", account.name),
          })),
        }}
        getErrorMessage={() => t("errors.no_account")}
      />

      <ControlledField
        control={form.control}
        field={{
          type: "date",
          name: "transactionDate",
          id: dateId,
          label: t("effectiveDateLabel"),
          required: true,
          testId: "refund-date",
        }}
        getErrorMessage={() => t("errors.invalid")}
      />

      <TextField
        id={noteId}
        label={t("noteLabel")}
        placeholder={t("notePlaceholder")}
        registration={form.register("note")}
        data-testid="refund-note"
      />

      {confirm ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="refund-preview"
        >
          <Text size="lg" weight="semibold">
            {t("confirmTitle")}
          </Text>
          <ConfirmSummary
            data-testid="refund-confirm-summary"
            rows={[
              {
                id: "original",
                label: t("originalTitle"),
                value: originalTitle,
                kind: "text",
              },
              {
                id: "amount",
                label: t("receipt.amount"),
                value: amountLabel ?? maxRefundableLabel,
              },
              {
                id: "account",
                label: t("destinationLabel"),
                value: selectedAccount
                  ? localizeCatalogName(
                      tCatalog,
                      "accounts",
                      selectedAccount.name,
                    )
                  : t("emptyValue"),
                kind: "text",
              },
              {
                id: "date",
                label: t("effectiveDateLabel"),
                value: transactionDate
                  ? formatDate(new Date(`${transactionDate}T00:00:00Z`), locale)
                  : t("emptyValue"),
                kind: "text",
              },
            ]}
          />
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
            {t("backToForm")}
          </Button>
        </section>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          data-testid="refund-submit"
          isDisabled={isPending || !online}
          onPress={reviewRefund}
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
