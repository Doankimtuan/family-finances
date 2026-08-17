"use client";

import { useId, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  TransactionDirection,
  TransactionTag,
} from "@/modules/ledger/application/client";
import {
  TransactionDirection as Direction,
  TRANSACTION_DIRECTION_OPTIONS,
} from "@/modules/ledger/application/client";
import {
  recordTransactionInputSchema,
  type RecordTransactionInput,
} from "@/modules/ledger/application/commands/record-transaction.schema";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { recordTransactionAction } from "./actions";
import { setTransactionTagsAction } from "./tag-actions";
import { TransactionReceipt } from "./transaction-receipt";
import { TransactionTagSelector } from "./transaction-tag-ui";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";

type Props = {
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  transactionTags: TransactionTag[];
  currency: string;
  initialDirection?: TransactionDirection;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const captureTransactionFormSchema = recordTransactionInputSchema
  .extend({
    transactionTagIds: z.array(z.string().uuid()),
  })
  .extend({
    amount: z.preprocess(
      (value) => (value == null ? undefined : value),
      recordTransactionInputSchema.shape.amount,
    ),
  });

type CaptureTransactionFormInput = z.input<typeof captureTransactionFormSchema>;
type CaptureTransactionFormValues = z.output<
  typeof captureTransactionFormSchema
>;

type ReceiptState = Pick<
  CaptureTransactionFormValues,
  "amount" | "type" | "transactionDate" | "note" | "categoryId" | "jarId"
> & {
  transactionId: string;
  inboxItemId: string | null;
  accountName: string;
  categoryName: string | null;
  jarName: string | null;
  tagAssignmentFailed: boolean;
};

type SubmittedTransaction = Omit<CaptureTransactionFormValues, "transactionTagIds">;

function createDefaultValues(
  accounts: LedgerAccount[],
  initialDirection: TransactionDirection,
): CaptureTransactionFormInput {
  return {
    accountId: accounts[0]?.id ?? "",
    type: initialDirection,
    amount: null,
    transactionDate: todayInputValue(),
    note: undefined,
    categoryId: null,
    jarId: null,
    idempotencyKey: crypto.randomUUID(),
    transactionTagIds: [],
  };
}

/**
 * Fast capture form — amount, direction, account, tags, note (money.transaction-add).
 */
export function CaptureTransactionForm({
  accounts,
  expenseTags,
  incomeTags,
  jars,
  transactionTags,
  currency,
  initialDirection = Direction.EXPENSE,
}: Props) {
  const t = useTranslations("money.captureForm");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const amountId = useId();
  const noteId = useId();
  const dateId = useId();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const defaultValues = createDefaultValues(accounts, initialDirection);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<
    CaptureTransactionFormInput,
    unknown,
    CaptureTransactionFormValues
  >({
    resolver: zodResolver(captureTransactionFormSchema),
    defaultValues,
  });

  const direction = useWatch({ control, name: "type" });
  const amount = useWatch({ control, name: "amount" });
  const accountId = useWatch({ control, name: "accountId" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const jarId = useWatch({ control, name: "jarId" });
  const transactionDate = useWatch({ control, name: "transactionDate" });
  const selectedTransactionTagIds = useWatch({
    control,
    name: "transactionTagIds",
  });
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const selectedAccountName = selectedAccount
    ? localizeCatalogName(tCatalog, "accounts", selectedAccount.name)
    : "";
  const numericAmount = typeof amount === "number" ? amount : null;
  const amountLabel =
    numericAmount != null && numericAmount > 0
      ? formatCurrency(numericAmount, currency, locale, {
          maximumFractionDigits: 0,
        })
      : null;

  const showCaptureError = (
    code: ProductActionErrorCode | ClientActionErrorCode | LedgerActionErrorCode,
  ) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t("errorTitle"),
      description: t(`errors.${code}`),
    });
  };

  const resetCaptureForm = () => {
    reset(createDefaultValues(accounts, initialDirection));
    statusAlert.hide();
  };

  const resetForm = () => {
    resetCaptureForm();
    setReceipt(null);
  };

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    if (!online) {
      showCaptureError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!values.accountId) {
      showCaptureError(CLIENT_ACTION_ERROR_CODE.NO_ACCOUNT);
      return;
    }

    startTransition(async () => {
      const { transactionTagIds, ...transaction } = values;
      const result = await recordTransactionAction(
        transaction satisfies RecordTransactionInput,
      );

      if (result.status !== "success") {
        showCaptureError(result.code);
        return;
      }

      const submittedTags =
        values.type === Direction.INCOME ? incomeTags : expenseTags;
      const submittedCategory = submittedTags.find(
        (tag) => tag.id === values.categoryId,
      );
      const submittedJar = jars.find((jar) => jar.id === values.jarId);
      const receiptTransaction: SubmittedTransaction = transaction;

      let tagAssignmentFailed = false;
      if (transactionTagIds.length > 0) {
        const tagResult = await setTransactionTagsAction(
          result.transactionId,
          transactionTagIds,
        );
        tagAssignmentFailed = tagResult.status === "error";
      }

      resetCaptureForm();
      setReceipt({
        ...receiptTransaction,
        transactionId: result.transactionId,
        inboxItemId: result.inboxItemId,
        accountName: selectedAccount
          ? localizeCatalogName(tCatalog, "accounts", selectedAccount.name)
          : "",
        categoryName: submittedCategory
          ? localizeCatalogName(tCatalog, "tags", submittedCategory.name)
          : null,
        jarName: submittedJar
          ? localizeCatalogName(tCatalog, "jars", submittedJar.name)
          : null,
        tagAssignmentFailed,
      });
    });
  });

  if (receipt) {
    const formattedAmount = formatCurrency(receipt.amount, currency, locale, {
      maximumFractionDigits: 0,
    });
    const signedAmount =
      receipt.type === Direction.EXPENSE
        ? `−${formattedAmount}`
        : `+${formattedAmount}`;

    const relatedRecords: { id: string; label: string; href?: string }[] = [];
    if (receipt.inboxItemId) {
      relatedRecords.push({
        id: "inbox",
        label: t("receipt.inboxReview"),
        href: APP_PATH.INBOX,
      });
    }

    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          { id: "amount", label: t("receipt.amount"), value: signedAmount },
          {
            id: "account",
            label: t("receipt.account"),
            value: receipt.accountName || "—",
          },
          {
            id: "category",
            label: t("receipt.category"),
            value: receipt.categoryName ?? t("tagNone"),
          },
          {
            id: "jar",
            label: t("receipt.jar"),
            value: receipt.jarName ?? t("jarUnmapped"),
          },
          {
            id: "note",
            label: t("receipt.note"),
            value: receipt.note?.trim() || "—",
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: receipt.transactionDate ?? todayInputValue(),
          },
        ]}
        relatedRecords={relatedRecords.length > 0 ? relatedRecords : undefined}
        relatedRecordsTitle={
          relatedRecords.length > 0 ? t("receipt.relatedRecords") : undefined
        }
        nextActions={[
          {
            id: "view",
            label: t("receipt.viewTransaction"),
            href: moneyTransactionPath(receipt.transactionId),
            variant: "primary",
          },
          {
            id: "record-another",
            label: t("receipt.recordAnother"),
            onPress: resetForm,
            variant: "secondary",
          },
          {
            id: "money",
            label: t("receipt.goToMoney"),
            href: APP_PATH.MONEY,
            variant: "secondary",
          },
          ...(receipt.inboxItemId
            ? [
                {
                  id: "inbox",
                  label: t("receipt.goToInbox"),
                  href: APP_PATH.INBOX,
                  variant: "secondary" as const,
                },
              ]
            : []),
        ]}
      >
        {receipt.tagAssignmentFailed ? (
          <StatusAlert variant="warning" title={t("tagAssignmentFailed")} />
        ) : null}
        <div className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)">
          <Text size="sm" className="font-medium text-text-primary">
            {receipt.type === Direction.EXPENSE
              ? t("receipt.accountEffectExpense", { amount: formattedAmount })
              : t("receipt.accountEffectIncome", { amount: formattedAmount })}
          </Text>
          <Text size="sm" tone="secondary">
            {receipt.inboxItemId
              ? t("receipt.inboxReview")
              : t("receipt.noInbox")}
          </Text>
        </div>
      </TransactionReceipt>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-(--space-4)"
      data-testid="money-capture-form"
    >
      {!online ? (
        <StatusAlert
          variant={AlertVariant.WARNING}
          title={t("errors.offline")}
          description={t("offlineHint")}
        />
      ) : null}

      <div className="rounded-xl border border-accent/25 bg-accent/10 p-(--space-4) shadow-[var(--elevation-1)]">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <AmountField
              id={amountId}
              label={t("amountLabel")}
              placeholder="0"
              value={typeof field.value === "number" ? field.value : null}
              onValueChange={(value) => field.onChange(value)}
              error={errors.amount ? t("errors.invalid") : undefined}
              required
              data-testid="capture-amount"
              description={t("amountHint", { currency })}
              className="min-h-14 text-2xl font-semibold tabular-nums tracking-tight"
            />
          )}
        />

        <fieldset className="mt-(--space-4) flex flex-col gap-(--space-2)">
          <legend className="text-sm font-semibold text-text-primary">
            {t("directionLabel")}
          </legend>
          <div
            className="grid grid-cols-2 gap-(--space-2) rounded-lg bg-surface/70 p-(--space-1)"
            role="radiogroup"
          >
            {TRANSACTION_DIRECTION_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={direction === value}
                data-testid={`capture-direction-${value}`}
                className={
                  direction === value
                    ? "min-h-11 rounded-md border border-accent/40 bg-surface px-(--space-3) text-sm font-semibold text-text-primary shadow-[var(--elevation-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    : "min-h-11 rounded-md px-(--space-3) text-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                }
                onClick={() => {
                  setValue("type", value, { shouldValidate: true });
                  setValue("categoryId", null, { shouldValidate: true });
                }}
              >
                {t(`direction.${value}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("accountLabel")}
        </legend>
        {accounts.length === 0 ? (
          <StatusAlert
            variant="warning"
            title={t("errors.no_account")}
            description={t("addAccountHint")}
          />
        ) : (
          <div className="flex flex-col gap-(--space-2)">
            {accounts.map((account) => (
              <label
                key={account.id}
                className="flex min-h-11 cursor-pointer items-center gap-(--space-3) rounded-md border border-border-subtle bg-canvas px-(--space-3) has-[:checked]:border-accent/40 has-[:checked]:bg-accent/10"
              >
                <input
                  type="radio"
                  value={account.id}
                  {...register("accountId")}
                  checked={accountId === account.id}
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-text-primary">
                  {localizeCatalogName(tCatalog, "accounts", account.name)}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <LabeledDateInput
          label={t("receipt.date")}
          value={transactionDate ?? ""}
          onChange={(e) =>
            setValue("transactionDate", e.target.value, {
              shouldValidate: true,
            })
          }
          error={errors.transactionDate ? t("errors.invalid") : undefined}
          data-testid={dateId}
        />
      </div>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("tagLabel")}
        </legend>
        <Text size="sm" tone="secondary">
          {t("tagHint")}
        </Text>
        <div className="flex flex-wrap gap-(--space-2)">
          <button
            type="button"
            aria-pressed={!categoryId}
            className={
              !categoryId
                ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                : "min-h-11 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            }
            onClick={() =>
              setValue("categoryId", null, { shouldValidate: true })
            }
          >
            {t("tagNone")}
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              aria-pressed={categoryId === tag.id}
              data-testid={`capture-tag-${tag.name.toLowerCase()}`}
              className={
                categoryId === tag.id
                  ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              }
              onClick={() => {
                setValue("categoryId", tag.id, { shouldValidate: true });
                if (tag.jarId) {
                  setValue("jarId", tag.jarId, { shouldValidate: true });
                }
              }}
            >
              {localizeCatalogName(tCatalog, "tags", tag.name)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("transactionTagsLabel")}
        </legend>
        <Text size="sm" tone="secondary">
          {t("transactionTagsHint")}
        </Text>
        <TransactionTagSelector
          availableTags={transactionTags}
          selectedIds={selectedTransactionTagIds}
          onChange={(value) =>
            setValue("transactionTagIds", value, { shouldValidate: true })
          }
        />
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("jarLabel")}
        </legend>
        <Text size="sm" tone="secondary">
          {direction === Direction.EXPENSE
            ? t("jarHintExpense")
            : t("jarHintIncome")}
        </Text>
        <LabeledSelect
          label={t("jarLabel")}
          value={jarId ?? ""}
          onChange={(e) =>
            setValue("jarId", e.target.value || null, { shouldValidate: true })
          }
          error={errors.jarId ? t("errors.invalid") : undefined}
          hideLabel
          data-testid="capture-jar"
          options={[
            { id: "", label: t("jarUnmapped") },
            ...jars.map((jar) => ({
              id: jar.id,
              label: localizeCatalogName(tCatalog, "jars", jar.name),
            })),
          ]}
        />
      </fieldset>

      <div className="rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <TextField
          id={noteId}
          label={t("noteLabel")}
          registration={register("note")}
          error={errors.note ? t("errors.invalid") : undefined}
          placeholder={t("notePlaceholder")}
          data-testid="capture-note"
        />
      </div>

      <div
        className="rounded-xl border border-accent/25 bg-accent/10 px-(--space-4) py-(--space-3)"
        aria-live="polite"
        data-testid="capture-preview"
      >
        <Text size="sm" weight="medium">
          {t("previewTitle")}
        </Text>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {amountLabel && selectedAccountName
            ? t("previewReady", {
                direction: t(`direction.${direction}`).toLowerCase(),
                amount: amountLabel,
                account: selectedAccountName,
              })
            : t("previewEmpty")}
        </Text>
      </div>

      <BottomActionBar>
        <Button
          type="button"
          variant="primary"
          className="w-full"
          data-testid="capture-save"
          isDisabled={isPending || !online || accounts.length === 0}
          onPress={() => void onSubmit()}
        >
          {isPending ? t("saving") : t("save")}
        </Button>

        <Link
          href={APP_PATH.MONEY}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("cancel")}
        </Link>
      </BottomActionBar>
    </form>
  );
}
