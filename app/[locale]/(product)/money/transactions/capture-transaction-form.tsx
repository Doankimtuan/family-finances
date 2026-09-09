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
import {
  CAPTURE_CATEGORY_NONE_OPTION_ID,
  CAPTURE_JAR_UNMAPPED_OPTION_ID,
} from "@/modules/ledger/application/transaction-constants";
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
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { Card } from "@/shared/patterns/card";
import type { ConfirmSummaryRow } from "@/shared/patterns/confirm-summary";
import { CaptureSurface } from "./capture-surface";
import { CaptureTransactionConfirmSheet } from "./capture-transaction-confirm-sheet";
import {
  CAPTURE_AMOUNT_FIELD_CLASS,
  CAPTURE_FIELDSET_LEGEND_CLASS,
  CAPTURE_SPLIT_CANCEL_LINK_CLASS,
} from "./transaction-chrome";
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

function captureAccountName(
  tCatalog: Parameters<typeof localizeCatalogName>[0],
  name: string,
) {
  return localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, name);
}

function captureAccountChoiceLabel(
  tCatalog: Parameters<typeof localizeCatalogName>[0],
  account: LedgerAccount,
  creditCardLabel: string,
  typeLabel: string,
) {
  const name = captureAccountName(tCatalog, account.name);
  if (account.type === AccountType.CREDIT_CARD) {
    return `${name} · ${creditCardLabel}`;
  }
  if (name.trim().toLowerCase() === typeLabel.trim().toLowerCase()) {
    return name;
  }
  return `${name} · ${typeLabel}`;
}

function accountFieldLabelKey(direction: TransactionDirection) {
  return direction === Direction.EXPENSE
    ? ("expenseAccountLabel" as const)
    : ("incomeAccountLabel" as const);
}

function captureDirectionLabelKey(direction: TransactionDirection) {
  return direction === Direction.INCOME
    ? ("direction.income" as const)
    : ("direction.expense" as const);
}

function formatCaptureConfirmDate(isoDate: string, locale: string) {
  return formatDate(new Date(`${isoDate}T00:00:00Z`), locale);
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
  const tTypes = useTranslations("money.types");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const amountId = useId();
  const noteId = useId();
  const dateId = useId();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [pendingSubmission, setPendingSubmission] =
    useState<CaptureTransactionFormValues | null>(null);
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
  const selectedTransactionTagIds = useWatch({
    control,
    name: "transactionTagIds",
  });
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const selectedAccountName = selectedAccount
    ? captureAccountName(tCatalog, selectedAccount.name)
    : "";
  const accountLabel = t(accountFieldLabelKey(direction));
  const jarHint =
    direction === Direction.EXPENSE ? t("jarHintExpense") : t("jarHintIncome");
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
    setPendingSubmission(null);
    setReceipt(null);
  };

  const closeConfirmation = () => {
    if (isPending) return;
    setPendingSubmission(null);
  };

  const resolveSubmittedContext = (values: CaptureTransactionFormValues) => {
    const submittedTags =
      values.type === Direction.INCOME ? incomeTags : expenseTags;
    const submittedCategory = values.categoryId
      ? submittedTags.find((tag) => tag.id === values.categoryId)
      : undefined;
    const submittedJar = values.jarId
      ? jars.find((jar) => jar.id === values.jarId)
      : undefined;
    const submittedAccount = accounts.find(
      (account) => account.id === values.accountId,
    );
    return {
      accountName: submittedAccount
        ? captureAccountName(tCatalog, submittedAccount.name)
        : "",
      categoryName: submittedCategory
        ? localizeCatalogName(
            tCatalog,
            CatalogGroup.TAGS,
            submittedCategory.name,
          )
        : null,
      jarName: submittedJar
        ? localizeCatalogName(tCatalog, CatalogGroup.JARS, submittedJar.name)
        : null,
    };
  };

  const pendingContext = pendingSubmission
    ? resolveSubmittedContext(pendingSubmission)
    : null;
  const pendingNote = pendingSubmission?.note?.trim();
  const confirmRows: ConfirmSummaryRow[] =
    pendingSubmission && pendingContext
      ? [
          {
            id: "amount",
            label: t("receipt.amount"),
            value: formatCurrency(pendingSubmission.amount, currency, locale, {
              maximumFractionDigits: 0,
            }),
          },
          {
            id: "direction",
            label: t("directionLabel"),
            value: t(captureDirectionLabelKey(pendingSubmission.type)),
            kind: "text",
          },
          {
            id: "account",
            label: t("accountLabel"),
            value: pendingContext.accountName,
            kind: "text",
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: formatCaptureConfirmDate(
              pendingSubmission.transactionDate ?? todayIsoDate(),
              locale,
            ),
            kind: "text",
          },
          ...(pendingContext.categoryName
            ? [
                {
                  id: "category",
                  label: t("receipt.category"),
                  value: pendingContext.categoryName,
                  kind: "text" as const,
                },
              ]
            : []),
          ...(pendingContext.jarName
            ? [
                {
                  id: "jar",
                  label: t("receipt.jar"),
                  value: pendingContext.jarName,
                  kind: "text" as const,
                },
              ]
            : []),
          ...(pendingNote
            ? [
                {
                  id: "note",
                  label: t("receipt.note"),
                  value: pendingNote,
                  kind: "text" as const,
                },
              ]
            : []),
        ]
      : [];

  const openConfirmation = handleSubmit((values) => {
    statusAlert.hide();
    if (!online) {
      showCaptureError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!values.accountId) {
      showCaptureError(CLIENT_ACTION_ERROR_CODE.NO_ACCOUNT);
      return;
    }
    setPendingSubmission(values);
  });

  const confirmSubmission = () => {
    if (!pendingSubmission || isPending) return;
    statusAlert.hide();
    if (!online) {
      showCaptureError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }

    const values = pendingSubmission;
    startTransition(async () => {
      const { transactionTagIds, ...transaction } = values;
      const result = await recordTransactionAction(
        transaction satisfies RecordTransactionInput,
      );

      if (result.status !== "success") {
        showCaptureError(result.code);
        return;
      }

      const { accountName, categoryName, jarName } =
        resolveSubmittedContext(values);
      const receiptTransaction: SubmittedTransaction = transaction;

      let tagAssignmentFailed = false;
      if (transactionTagIds.length > 0) {
        const tagResult = await setTransactionTagsAction(
          result.transactionId,
          transactionTagIds,
        );
        tagAssignmentFailed = tagResult.status === "error";
      }

      setPendingSubmission(null);
      resetCaptureForm();
      setReceipt({
        ...receiptTransaction,
        transactionId: result.transactionId,
        inboxItemId: result.inboxItemId,
        accountName,
        categoryName,
        jarName,
        tagAssignmentFailed,
      });
    });
  };

  if (receipt) {
    const formattedAmount = formatCurrency(receipt.amount, currency, locale, {
      maximumFractionDigits: 0,
    });
    const signedAmount =
      receipt.type === Direction.EXPENSE
        ? `−${formattedAmount}`
        : `+${formattedAmount}`;
    const accountEffectKey =
      receipt.type === Direction.EXPENSE
        ? "receipt.accountEffectExpense"
        : "receipt.accountEffectIncome";

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
        <CaptureSurface className="border-success/25 bg-success/10 shadow-none">
          <Text size="sm" className="font-medium text-text-primary">
            {typeof t.rich === "function"
              ? t.rich(accountEffectKey, {
                  amount: () => (
                    <FinancialValue>{formattedAmount}</FinancialValue>
                  ),
                })
              : t(accountEffectKey, { amount: FINANCIAL_PRIVACY_MASK })}
          </Text>
          <Text size="sm" tone="secondary">
            {receipt.inboxItemId
              ? t("receipt.inboxReview")
              : t("receipt.noInbox")}
          </Text>
        </CaptureSurface>
      </TransactionReceipt>
    );
  }

  return (
    <>
      <form
        onSubmit={openConfirmation}
        className="flex min-h-0 flex-1 flex-col"
        data-testid="money-capture-form"
      >
        <div
          className="flex min-h-0 flex-1 flex-col gap-(--space-5) overflow-y-auto overscroll-y-contain"
          data-testid="money-capture-fields"
        >
          {!online ? (
            <StatusAlert
              variant={AlertVariant.WARNING}
              title={t("errors.offline")}
              description={t("offlineHint")}
            />
          ) : null}

          <CaptureSurface>
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
                  autoFocus
                  enterKeyHint="done"
                  data-testid="capture-amount"
                  className={CAPTURE_AMOUNT_FIELD_CLASS}
                />
              )}
            />
          </CaptureSurface>

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
                  <CaptureSurface testId="capture-account">
                    <fieldset className="flex min-w-0 flex-col gap-(--space-2)">
                      <legend className={CAPTURE_FIELDSET_LEGEND_CLASS}>
                        {accountLabel}
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
                            label={captureAccountChoiceLabel(
                              tCatalog,
                              account,
                              t("creditCardLabel"),
                              tTypes(account.type),
                            )}
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
                  </CaptureSurface>
                ) : (
                  <SelectField
                    id="capture-account"
                    label={accountLabel}
                    description={t("accountHint")}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={
                      errors.accountId ? t("errors.no_account") : undefined
                    }
                    required
                    data-testid="capture-account"
                    options={accounts.map((account) => ({
                      id: account.id,
                      label: captureAccountChoiceLabel(
                        tCatalog,
                        account,
                        t("creditCardLabel"),
                        tTypes(account.type),
                      ),
                    }))}
                  />
                )
              }
            />
          )}

          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <SelectField
                id="capture-category"
                label={t("tagLabel")}
                value={field.value ?? CAPTURE_CATEGORY_NONE_OPTION_ID}
                onChange={(value) => {
                  if (value === CAPTURE_CATEGORY_NONE_OPTION_ID) {
                    field.onChange(null);
                    setValue("jarId", null, { shouldValidate: true });
                    return;
                  }
                  const selectedTag = tags.find((tag) => tag.id === value);
                  field.onChange(value);
                  setValue("jarId", selectedTag?.jarId ?? null, {
                    shouldValidate: true,
                  });
                }}
                onBlur={field.onBlur}
                data-testid="capture-category"
                options={[
                  {
                    id: CAPTURE_CATEGORY_NONE_OPTION_ID,
                    label: t("tagNone"),
                  },
                  ...tags.map((tag) => ({
                    id: tag.id,
                    label: localizeCatalogName(
                      tCatalog,
                      CatalogGroup.TAGS,
                      tag.name,
                    ),
                  })),
                ]}
              />
            )}
          />

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

          <TextField
            id={noteId}
            label={t("noteLabel")}
            registration={register("note")}
            error={errors.note ? t("errors.invalid") : undefined}
            placeholder={t("notePlaceholder")}
            data-testid="capture-note"
          />

          <details
            className="rounded-[var(--radius-control)] bg-surface-muted/55 px-(--space-4) py-(--space-2)"
            data-testid="capture-optional-details"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
              {t("moreDetails")}
            </summary>
            <div className="flex flex-col gap-(--space-4) border-t border-border-subtle pb-(--space-3) pt-(--space-4)">
              <Text size="sm" tone="secondary">
                {jarHint}
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
                        label: localizeCatalogName(
                          tCatalog,
                          CatalogGroup.JARS,
                          jar.name,
                        ),
                      })),
                    ]}
                  />
                )}
              />
              <fieldset className="flex min-w-0 flex-col gap-(--space-2)">
                <legend className={CAPTURE_FIELDSET_LEGEND_CLASS}>
                  {t("transactionTagsLabel")}
                </legend>
                <div className="flex flex-col gap-(--space-3)">
                  <Text size="sm" tone="secondary">
                    {t("transactionTagsHint")}
                  </Text>
                  <TransactionTagSelector
                    availableTags={transactionTags}
                    selectedIds={selectedTransactionTagIds}
                    onChange={(value) =>
                      setValue("transactionTagIds", value, {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </fieldset>
            </div>
          </details>

          {amountLabel && selectedAccountName ? (
            <Card
              tone="highlighted"
              className="gap-(--space-1) p-(--space-4)"
              aria-live="polite"
              data-testid="capture-preview"
            >
              <Text size="sm" weight="medium">
                {t("previewTitle")}
              </Text>
              <Text size="sm" tone="secondary">
                {typeof t.rich === "function"
                  ? t.rich(previewMessageKey, {
                      amount: () => (
                        <FinancialValue>{amountLabel}</FinancialValue>
                      ),
                      account: selectedAccountName,
                    })
                  : t(previewMessageKey, {
                      amount: FINANCIAL_PRIVACY_MASK,
                      account: selectedAccountName,
                    })}
              </Text>
            </Card>
          ) : null}
        </div>

        <BottomActionBar
          className="mt-auto shrink-0"
          layout={BottomActionBarLayout.SPLIT}
        >
          <Link
            href={APP_PATH.MONEY}
            className={CAPTURE_SPLIT_CANCEL_LINK_CLASS}
          >
            {t("cancel")}
          </Link>
          <Button
            type="button"
            variant="primary"
            className="min-w-0 flex-[2] shadow-none"
            data-testid="capture-save"
            isDisabled={
              isPending ||
              pendingSubmission != null ||
              !online ||
              accounts.length === 0
            }
            onPress={() => void openConfirmation()}
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </BottomActionBar>
      </form>
      {pendingSubmission ? (
        <CaptureTransactionConfirmSheet
          isOpen
          isPending={isPending}
          isOnline={online}
          title={t("confirmTitle")}
          rows={confirmRows}
          secondaryLabel={t("back")}
          primaryLabel={isPending ? t("saving") : t("save")}
          onClose={closeConfirmation}
          onConfirm={confirmSubmission}
        />
      ) : null}
    </>
  );
}
