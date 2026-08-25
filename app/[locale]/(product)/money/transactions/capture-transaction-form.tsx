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
import { TransactionDirection as Direction } from "@/modules/ledger/application/client";
import {
  AccountType,
  CAPTURE_ACCOUNT_COMPACT_LIMIT,
} from "@/modules/ledger/application/account-constants";
import { CAPTURE_JAR_UNMAPPED_OPTION_ID } from "@/modules/ledger/application/transaction-constants";
import {
  recordTransactionInputSchema,
  type RecordTransactionInput,
} from "@/modules/ledger/application/commands/record-transaction.schema";
import { DatePickerField, SelectField, TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import {
  BottomActionBar,
  BottomActionBarLayout,
} from "@/shared/patterns/bottom-action-bar";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";
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
import { todayIsoDate } from "@/shared/utils/iso-date";

type Props = {
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  transactionTags: TransactionTag[];
  currency: string;
  initialDirection?: TransactionDirection;
};

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

type SubmittedTransaction = Omit<
  CaptureTransactionFormValues,
  "transactionTagIds"
>;

function capturePreviewMessageKey(
  direction: TransactionDirection,
  accountType?: AccountType,
) {
  if (direction === Direction.INCOME) return "previewReadyIncome" as const;
  if (accountType === AccountType.CREDIT_CARD) {
    return "previewReadyCard" as const;
  }
  return "previewReadyCash" as const;
}

function createDefaultValues(
  accounts: LedgerAccount[],
  initialDirection: TransactionDirection,
): CaptureTransactionFormInput {
  return {
    accountId: accounts[0]?.id ?? "",
    type: initialDirection,
    amount: null,
    transactionDate: todayIsoDate(),
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
  const selectedTransactionTagIds = useWatch({
    control,
    name: "transactionTagIds",
  });
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const selectedAccountName = selectedAccount
    ? localizeCatalogName(tCatalog, "accounts", selectedAccount.name)
    : "";
  const useCompactAccountPicker =
    accounts.length <= CAPTURE_ACCOUNT_COMPACT_LIMIT;
  const numericAmount = typeof amount === "number" ? amount : null;
  const amountLabel =
    numericAmount != null && numericAmount > 0
      ? formatCurrency(numericAmount, currency, locale, {
          maximumFractionDigits: 0,
        })
      : null;
  const previewMessageKey = capturePreviewMessageKey(
    direction,
    selectedAccount?.type,
  );

  const showCaptureError = (
    code:
      ProductActionErrorCode | ClientActionErrorCode | LedgerActionErrorCode,
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

    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          { id: "amount", label: t("receipt.amount"), value: signedAmount },
          {
            id: "account",
            label: t("receipt.account"),
            value: receipt.accountName || t("emptyValue"),
          },
          {
            id: "category",
            label: t("receipt.category"),
            value: receipt.categoryName ?? t("tagNone"),
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: receipt.transactionDate ?? todayIsoDate(),
          },
        ]}
        relatedRecords={
          receipt.inboxItemId
            ? [
                {
                  id: "inbox",
                  label: t("receipt.inboxReview"),
                  href: APP_PATH.INBOX,
                },
              ]
            : undefined
        }
        relatedRecordsTitle={
          receipt.inboxItemId ? t("receipt.relatedRecords") : undefined
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
            id: "done",
            label: t("receipt.done"),
            href: APP_PATH.MONEY,
            variant: "tertiary",
          },
        ]}
      >
        {receipt.tagAssignmentFailed ? (
          <StatusAlert variant="warning" title={t("tagAssignmentFailed")} />
        ) : null}
        <div className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)">
          <Text size="sm" className="font-medium text-text-primary">
            {receipt.type === Direction.EXPENSE
              ? typeof t.rich === "function"
                ? t.rich("receipt.accountEffectExpense", {
                    amount: () => (
                      <FinancialValue>{formattedAmount}</FinancialValue>
                    ),
                  })
                : t("receipt.accountEffectExpense", {
                    amount: FINANCIAL_PRIVACY_MASK,
                  })
              : typeof t.rich === "function"
                ? t.rich("receipt.accountEffectIncome", {
                    amount: () => (
                      <FinancialValue>{formattedAmount}</FinancialValue>
                    ),
                  })
                : t("receipt.accountEffectIncome", {
                    amount: FINANCIAL_PRIVACY_MASK,
                  })}
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
      className="flex flex-col gap-(--space-5)"
      data-testid="money-capture-form"
    >
      {!online ? (
        <StatusAlert
          variant={AlertVariant.WARNING}
          title={t("errors.offline")}
          description={t("offlineHint")}
        />
      ) : null}

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AmountField
            id={amountId}
            label={t("amountLabel", { currency })}
            placeholder="0"
            value={typeof field.value === "number" ? field.value : null}
            onValueChange={(value) => field.onChange(value)}
            error={errors.amount ? t("errors.invalid") : undefined}
            required
            data-testid="capture-amount"
            className="min-h-16 rounded-[var(--radius-card)] border border-border-subtle bg-surface px-(--space-4) text-2xl font-semibold tracking-tight shadow-(--elevation-1) focus-visible:border-accent"
          />
        )}
      />

      <div>
        {accounts.length === 0 ? (
          <StatusAlert
            variant="warning"
            title={t("errors.no_account")}
            description={t("addAccountHint")}
          />
        ) : (
          <Controller
            control={control}
            name="accountId"
            render={({ field }) =>
              useCompactAccountPicker ? (
                <fieldset
                  className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/45 p-(--space-3)"
                  data-testid="capture-account"
                >
                  <legend className="text-base font-semibold tracking-tight text-text-primary">
                    {t(
                      direction === Direction.EXPENSE
                        ? "expenseAccountLabel"
                        : "incomeAccountLabel",
                    )}
                  </legend>
                  <ChoiceTileGroup
                    hint={
                      selectedAccount?.type === AccountType.CREDIT_CARD
                        ? t("creditCardHint")
                        : undefined
                    }
                  >
                    {accounts.map((account) => (
                      <ChoiceTile
                        key={account.id}
                        label={
                          account.type === AccountType.CREDIT_CARD
                            ? `${localizeCatalogName(
                                tCatalog,
                                "accounts",
                                account.name,
                              )} · ${t("creditCardLabel")}`
                            : localizeCatalogName(
                                tCatalog,
                                "accounts",
                                account.name,
                              )
                        }
                        selected={field.value === account.id}
                        onPress={() => field.onChange(account.id)}
                        role="radio"
                        icon={
                          <AppIcon
                            icon={
                              account.type === AccountType.CREDIT_CARD
                                ? FINANCE_ICONS.card
                                : FINANCE_ICONS.wallet
                            }
                            size="sm"
                          />
                        }
                      />
                    ))}
                  </ChoiceTileGroup>
                  {errors.accountId ? (
                    <Text size="sm" className="text-danger">
                      {t("errors.no_account")}
                    </Text>
                  ) : null}
                </fieldset>
              ) : (
                <SelectField
                  id="capture-account"
                  label={t(
                    direction === Direction.EXPENSE
                      ? "expenseAccountLabel"
                      : "incomeAccountLabel",
                  )}
                  description={t("accountHint")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.accountId ? t("errors.no_account") : undefined}
                  required
                  data-testid="capture-account"
                  options={accounts.map((account) => ({
                    id: account.id,
                    label: localizeCatalogName(
                      tCatalog,
                      "accounts",
                      account.name,
                    ),
                  }))}
                />
              )
            }
          />
        )}
      </div>

      <Controller
        control={control}
        name="transactionDate"
        render={({ field }) => (
          <DatePickerField
            id={dateId}
            label={t("effectiveDateLabel")}
            value={field.value ?? ""}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
            error={errors.transactionDate ? t("errors.invalid") : undefined}
            data-testid="capture-date"
          />
        )}
      />

      <fieldset className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/45 p-(--space-3)">
        <legend className="text-base font-semibold tracking-tight text-text-primary">
          {t("tagLabel")}
        </legend>
        <div className="flex flex-wrap gap-(--space-2)">
          <button
            type="button"
            aria-pressed={!categoryId}
            className={
              !categoryId
                ? "min-h-11 rounded-full bg-accent px-(--space-3) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
                : "min-h-11 rounded-full border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
            }
            onClick={() => {
              setValue("categoryId", null, { shouldValidate: true });
              setValue("jarId", null, { shouldValidate: true });
            }}
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
                  ? "min-h-11 rounded-full bg-accent px-(--space-3) text-sm font-medium text-accent-fg shadow-(--elevation-1) transition-[background-color,transform] duration-(--duration-fast) hover:bg-accent/90 active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
                  : "min-h-11 rounded-full border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
              }
              onClick={() => {
                setValue("categoryId", tag.id, { shouldValidate: true });
                setValue("jarId", tag.jarId ?? null, { shouldValidate: true });
              }}
            >
              {localizeCatalogName(tCatalog, "tags", tag.name)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/35 p-(--space-3)">
        <Text size="sm" tone="secondary">
          {direction === Direction.EXPENSE
            ? t("jarHintExpense")
            : t("jarHintIncome")}
        </Text>
        <Controller
          control={control}
          name="jarId"
          render={({ field }) => (
            <SelectField
              id="capture-jar"
              label={t("jarLabel")}
              value={field.value ?? CAPTURE_JAR_UNMAPPED_OPTION_ID}
              onChange={(value) =>
                field.onChange(
                  value === CAPTURE_JAR_UNMAPPED_OPTION_ID ? null : value,
                )
              }
              onBlur={field.onBlur}
              error={errors.jarId ? t("errors.invalid") : undefined}
              data-testid="capture-jar"
              options={[
                {
                  id: CAPTURE_JAR_UNMAPPED_OPTION_ID,
                  label: t("jarUnmapped"),
                },
                ...jars.map((jar) => ({
                  id: jar.id,
                  label: localizeCatalogName(tCatalog, "jars", jar.name),
                })),
              ]}
            />
          )}
        />
      </div>

      <fieldset className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/35 p-(--space-3)">
        <legend className="text-base font-semibold tracking-tight text-text-primary">
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

      <TextField
        id={noteId}
        label={t("noteLabel")}
        registration={register("note")}
        error={errors.note ? t("errors.invalid") : undefined}
        placeholder={t("notePlaceholder")}
        data-testid="capture-note"
        className="rounded-[var(--radius-card)] bg-surface/55"
      />

      {amountLabel && selectedAccountName ? (
        <div
          className="rounded-[var(--radius-card)] border border-accent/20 bg-accent/5 px-(--space-3) py-(--space-3)"
          aria-live="polite"
          data-testid="capture-preview"
        >
          <Text size="sm" weight="medium">
            {t("previewTitle")}
          </Text>
          <Text size="sm" tone="secondary" className="mt-(--space-1)">
            {typeof t.rich === "function"
              ? t.rich(previewMessageKey, {
                  amount: () => <FinancialValue>{amountLabel}</FinancialValue>,
                  account: selectedAccountName,
                })
              : t(previewMessageKey, {
                  amount: FINANCIAL_PRIVACY_MASK,
                  account: selectedAccountName,
                })}
          </Text>
        </div>
      ) : null}

      <BottomActionBar layout={BottomActionBarLayout.SPLIT}>
        <Link
          href={APP_PATH.MONEY}
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
        >
          {t("cancel")}
        </Link>
        <Button
          type="button"
          variant="primary"
          className="min-w-0 flex-[2] shadow-none"
          data-testid="capture-save"
          isDisabled={isPending || !online || accounts.length === 0}
          onPress={() => void onSubmit()}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </BottomActionBar>
    </form>
  );
}
