"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  LedgerTransaction,
  CorrectTransactionInput,
} from "@/modules/ledger/application/client";
import {
  correctTransactionInputSchema,
  TransactionDirection as Direction,
  TRANSACTION_DIRECTION_OPTIONS,
} from "@/modules/ledger/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  LEDGER_ACTION_ERROR_CODE,
  type LedgerActionErrorCode,
} from "@/modules/ledger/application/client";
import { correctTransactionAction } from "../../mutate-actions";
import { TransactionReceipt } from "../../transaction-receipt";

type CorrectFormError =
  | ProductActionErrorCode
  | ClientActionErrorCode
  | typeof LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID
  | typeof LEDGER_ACTION_ERROR_CODE.CREDIT_LIMIT_EXCEEDED
  | typeof LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED
  | typeof LEDGER_ACTION_ERROR_CODE.REFUND_INVALID
  | typeof LEDGER_ACTION_ERROR_CODE.IMMUTABLE;

type ReceiptState = {
  correctionTransactionId: string;
  amount: number;
  accountName: string;
  transactionDate: string;
};

type Props = {
  transaction: LedgerTransaction;
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  currency: string;
};

function errorDescription(
  t: ReturnType<typeof useTranslations>,
  code: CorrectFormError,
) {
  switch (code) {
    case CLIENT_ACTION_ERROR_CODE.OFFLINE:
      return t("errors.offline");
    case CLIENT_ACTION_ERROR_CODE.NO_ACCOUNT:
      return t("errors.no_account");
    case PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED:
      return t("errors.unauthenticated");
    case PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP:
      return t("errors.no_membership");
    case PRODUCT_ACTION_ERROR_CODE.INVALID:
      return t("errors.invalid");
    case PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED:
      return t("errors.month_locked");
    case PRODUCT_ACTION_ERROR_CODE.UNKNOWN:
      return t("errors.unknown");
    case LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID:
      return t("errors.correction_invalid");
    case LEDGER_ACTION_ERROR_CODE.CREDIT_LIMIT_EXCEEDED:
      return t("errors.credit_limit_exceeded");
    case LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED:
      return t("errors.category_unmapped");
    case LEDGER_ACTION_ERROR_CODE.REFUND_INVALID:
      return t("errors.refund_invalid");
    case LEDGER_ACTION_ERROR_CODE.IMMUTABLE:
      return t("errors.immutable");
    default:
      return t("errors.unknown");
  }
}

function normalizeCorrectionError(
  code: ProductActionErrorCode | LedgerActionErrorCode,
): CorrectFormError {
  switch (code) {
    case LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID:
    case LEDGER_ACTION_ERROR_CODE.CREDIT_LIMIT_EXCEEDED:
    case LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED:
    case LEDGER_ACTION_ERROR_CODE.REFUND_INVALID:
    case LEDGER_ACTION_ERROR_CODE.IMMUTABLE:
      return code;
    default:
      return PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
  }
}

function createDefaultValues(
  transaction: LedgerTransaction,
): CorrectTransactionInput {
  return {
    originalTransactionId: transaction.id,
    amount: transaction.amount,
    type:
      transaction.type === Direction.INCOME
        ? Direction.INCOME
        : Direction.EXPENSE,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    jarId: transaction.jarId,
    note: transaction.note ?? undefined,
    transactionDate: transaction.transactionDate,
  };
}

export function CorrectTransactionForm({
  transaction,
  accounts,
  expenseTags,
  incomeTags,
  jars,
  currency,
}: Props) {
  const t = useTranslations("money.correctForm");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const typeId = useId();
  const accountId = useId();
  const dateId = useId();
  const categoryId = useId();
  const jarId = useId();
  const noteId = useId();
  const [errorCode, setErrorCode] = useState<CorrectFormError | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const form = useForm<CorrectTransactionInput>({
    resolver: zodResolver(correctTransactionInputSchema),
    defaultValues: createDefaultValues(transaction),
  });
  const direction = useWatch({ control: form.control, name: "type" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const selectedAccountId = useWatch({
    control: form.control,
    name: "accountId",
  });
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const selectedJarId = useWatch({ control: form.control, name: "jarId" });
  const transactionDate = useWatch({
    control: form.control,
    name: "transactionDate",
  });
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId,
  );
  const selectedTag = tags.find((tag) => tag.id === selectedCategoryId);
  const selectedJar = jars.find((jar) => jar.id === selectedJarId);
  const originalTitle =
    transaction.note ||
    (transaction.categoryName
      ? localizeCatalogName(tCatalog, "tags", transaction.categoryName)
      : null) ||
    t("originalFallback");
  const originalAccountName = transaction.accountName
    ? localizeCatalogName(tCatalog, "accounts", transaction.accountName)
    : t("emptyValue");
  const originalDate = formatDate(
    new Date(`${transaction.transactionDate}T00:00:00Z`),
    locale,
  );
  const correctedAmount =
    typeof amount === "number" && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : t("emptyValue");

  useEffect(() => {
    if (selectedTag) {
      form.setValue("jarId", selectedTag.jarId, { shouldDirty: true });
    }
  }, [form, selectedTag]);

  const validate = (values: CorrectTransactionInput) => {
    if (!values.accountId) {
      form.setError("accountId", { type: "required" });
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return false;
    }
    if (!values.transactionDate) {
      form.setError("transactionDate", { type: "required" });
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return false;
    }
    return true;
  };

  const reviewCorrection = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void form.handleSubmit(
      (values) => {
        if (validate(values)) setConfirm(true);
      },
      () => setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID),
    )();
  };

  const runCorrection = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void form.handleSubmit(
      (values) => {
        if (!validate(values)) return;
        startTransition(async () => {
          const result = await correctTransactionAction(values);
          if (result.status === "success") {
            const correctionTransactionId =
              result.correctionTransactionId ?? result.transactionId;
            if (!correctionTransactionId) {
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
              setConfirm(false);
              return;
            }
            const account = accounts.find(
              (candidate) => candidate.id === values.accountId,
            );
            setReceipt({
              correctionTransactionId,
              amount: values.amount,
              accountName: account
                ? localizeCatalogName(tCatalog, "accounts", account.name)
                : t("emptyValue"),
              transactionDate:
                values.transactionDate ?? transaction.transactionDate,
            });
            return;
          }
          setErrorCode(normalizeCorrectionError(result.code));
          setConfirm(false);
        });
      },
      () => setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID),
    )();
  };

  if (receipt) {
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          {
            id: "amount",
            label: t("receipt.amount"),
            value: formatCurrency(receipt.amount, currency, locale, {
              maximumFractionDigits: 0,
            }),
          },
          {
            id: "account",
            label: t("receipt.account"),
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
            value: formatCurrency(transaction.amount, currency, locale, {
              maximumFractionDigits: 0,
            }),
          },
        ]}
        nextActions={[
          {
            id: "view-correction",
            label: t("receipt.viewCorrection"),
            href: moneyTransactionPath(receipt.correctionTransactionId),
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
            label: t("receipt.backToActivity"),
            href: APP_PATH.MONEY_TRANSACTIONS,
            variant: "tertiary",
          },
        ]}
      >
        <div className="rounded-lg border border-border-subtle bg-surface-soft p-(--space-3)">
          <Text size="sm" tone="secondary">
            {t("consequenceBody")}
          </Text>
        </div>
      </TransactionReceipt>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-6)"
      data-testid="money-correct-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={errorDescription(t, errorCode)}
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
        <div className="flex flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle/80 bg-surface/70 p-(--space-4) shadow-(--elevation-1)">
          <Text size="base" weight="medium">
            {originalTitle}
          </Text>
          <Text size="sm" tone="secondary">
            {originalAccountName} · {originalDate}
          </Text>
          <Text size="sm" className="font-medium tabular-nums">
            <FinancialValue>
              {formatCurrency(transaction.amount, currency, locale, {
                maximumFractionDigits: 0,
              })}
            </FinancialValue>
          </Text>
        </div>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <Text size="lg" weight="semibold">
          {t("changeTitle")}
        </Text>
        <div className="flex flex-col gap-(--space-4)">
          <ControlledField
            control={form.control}
            field={{
              type: "select",
              name: "type",
              id: typeId,
              label: t("directionLabel"),
              required: true,
              testId: "correct-type",
              options: TRANSACTION_DIRECTION_OPTIONS.map((option) => ({
                id: option,
                label: t(`direction.${option}`),
              })),
            }}
            getErrorMessage={() => t("errors.invalid")}
          />
          <ControlledField
            control={form.control}
            field={{
              type: "amount",
              name: "amount",
              id: amountId,
              label: t("amountLabel"),
              description: t("amountHint", { currency }),
              required: true,
              testId: "correct-amount",
            }}
            getErrorMessage={() => t("errors.invalid")}
          />
          <ControlledField
            control={form.control}
            field={{
              type: "select",
              name: "accountId",
              id: accountId,
              label: t("accountLabel"),
              description: t("accountHint"),
              required: true,
              testId: "correct-account",
              options: accounts.map((account) => ({
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
              testId: "correct-date",
            }}
            getErrorMessage={() => t("errors.invalid")}
          />
          <ControlledField
            control={form.control}
            field={{
              type: "select",
              name: "categoryId",
              id: categoryId,
              label: t("tagLabel"),
              emptyValue: null,
              testId: "correct-category",
              options: [
                { id: "", label: t("tagNone") },
                ...tags.map((tag) => ({
                  id: tag.id,
                  label: localizeCatalogName(tCatalog, "tags", tag.name),
                })),
              ],
            }}
          />
          <ControlledField
            control={form.control}
            field={{
              type: "select",
              name: "jarId",
              id: jarId,
              label: t("jarLabel"),
              emptyValue: null,
              testId: "correct-jar",
              options: [
                { id: "", label: t("jarUnmapped") },
                ...jars.map((jar) => ({
                  id: jar.id,
                  label: localizeCatalogName(tCatalog, "jars", jar.name),
                })),
              ],
            }}
          />
          <TextField
            id={noteId}
            label={t("noteLabel")}
            placeholder={t("notePlaceholder")}
            registration={form.register("note")}
            data-testid="correct-note"
          />
        </div>
      </section>

      {confirm ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="correct-preview"
        >
          <Text size="lg" weight="semibold">
            {t("confirmTitle")}
          </Text>
          <div className="grid gap-(--space-3)">
            <div className="flex flex-col gap-(--space-2)">
              <Text size="sm" weight="medium">
                {t("beforeTitle")}
              </Text>
              <ConfirmSummary
                data-testid="correct-before"
                rows={[
                  {
                    id: "amount",
                    label: t("amountLabel"),
                    value: formatCurrency(
                      transaction.amount,
                      currency,
                      locale,
                      {
                        maximumFractionDigits: 0,
                      },
                    ),
                  },
                  {
                    id: "account",
                    label: t("accountLabel"),
                    value: originalAccountName,
                    kind: "text",
                  },
                  {
                    id: "date",
                    label: t("effectiveDateLabel"),
                    value: originalDate,
                    kind: "text",
                  },
                ]}
              />
            </div>
            <div className="flex flex-col gap-(--space-2)">
              <Text size="sm" weight="medium">
                {t("afterTitle")}
              </Text>
              <ConfirmSummary
                data-testid="correct-after"
                rows={[
                  {
                    id: "amount",
                    label: t("amountLabel"),
                    value: correctedAmount,
                  },
                  {
                    id: "account",
                    label: t("accountLabel"),
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
                      ? formatDate(
                          new Date(`${transactionDate}T00:00:00Z`),
                          locale,
                        )
                      : t("emptyValue"),
                    kind: "text",
                  },
                  {
                    id: "category",
                    label: t("tagLabel"),
                    value: selectedTag
                      ? localizeCatalogName(tCatalog, "tags", selectedTag.name)
                      : t("tagNone"),
                    kind: "text",
                  },
                  {
                    id: "jar",
                    label: t("jarLabel"),
                    value: selectedJar
                      ? localizeCatalogName(tCatalog, "jars", selectedJar.name)
                      : t("jarUnmapped"),
                    kind: "text",
                  },
                ]}
              />
            </div>
          </div>
          <StatusAlert
            variant="info"
            title={t("consequenceTitle")}
            description={t("consequenceBody")}
          />
          <Button
            variant="primary"
            className="w-full"
            data-testid="correct-confirm"
            isDisabled={isPending || !online}
            onPress={runCorrection}
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
        </section>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          data-testid="correct-submit"
          isDisabled={isPending || !online}
          onPress={reviewCorrection}
        >
          {t("submit")}
        </Button>
      )}

      <Link
        href={moneyTransactionPath(transaction.id)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        {t("cancel")}
      </Link>
      <Link
        href={APP_PATH.MONEY_TRANSACTIONS}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] text-sm text-text-secondary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        {t("back")}
      </Link>
    </div>
  );
}
