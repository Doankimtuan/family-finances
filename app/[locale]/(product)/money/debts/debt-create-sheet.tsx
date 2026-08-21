"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  DebtCreationMode,
  DebtDirection,
  DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  createDebtIdempotencyKey,
} from "@/modules/ledger/application/ledger-constants";
import {
  createDebtFormSchema,
  type CreateDebtFormValues,
} from "@/modules/ledger/application/commands/debt.schemas";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { AmountField } from "@/shared/patterns/amount-field";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { DatePickerField, SelectField } from "@/shared/ui/form";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { TransactionReceipt } from "../transactions/transaction-receipt";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { createDebtAction } from "../money-products-actions";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

type AccountOption = {
  id: string;
  name: string;
  type: string;
  balance: number;
};
type DebtCreateSheetProps = {
  accounts: AccountOption[];
  accountsLoadFailed: boolean;
  currency: string;
  locale: string;
  today: string;
};
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type DebtCreationReceipt = {
  transactionId: string;
  direction: DebtDirection;
  amount: number;
  accountName: string;
  effectiveDate: string;
  idempotentReplay: boolean;
};

export function DebtCreateSheet({
  accounts,
  accountsLoadFailed,
  currency,
  locale,
  today,
}: DebtCreateSheetProps) {
  const t = useTranslations("money.debtsPage");
  const tErrors = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receipt, setReceipt] = useState<DebtCreationReceipt | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    formState: { errors },
  } = useForm<CreateDebtFormValues>({
    resolver: zodResolver(createDebtFormSchema),
    defaultValues: {
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      counterparty: "",
      direction: DebtDirection.BORROWED,
      creationMode: DebtCreationMode.EXISTING_BALANCE,
      principalAmount: undefined,
      startDate: today,
      dueDate: null,
      note: "",
      accountId: null,
    },
  });
  const direction = useWatch({ control, name: "direction" });
  const financialScope = useWatch({ control, name: "financialScope" });
  const creationMode = useWatch({ control, name: "creationMode" });
  const principalAmount = useWatch({ control, name: "principalAmount" });
  const startDate = useWatch({ control, name: "startDate" });
  const accountId = useWatch({ control, name: "accountId" });
  const moneyMovesNow = creationMode === DebtCreationMode.MONEY_MOVED;

  function reset() {
    setIsConfirming(false);
    setReceipt(null);
    resetForm({
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      counterparty: "",
      direction: DebtDirection.BORROWED,
      creationMode: DebtCreationMode.EXISTING_BALANCE,
      principalAmount: undefined,
      startDate: today,
      dueDate: null,
      note: "",
      accountId: null,
    });
    setErrorCode(null);
  }

  function handleOpenChange(next: boolean) {
    reset();
    setIsOpen(next);
  }

  function chooseDirection(next: DebtDirection) {
    setValue("direction", next);
    setValue("accountId", null);
    setErrorCode(null);
  }

  function finish() {
    reset();
    setIsOpen(false);
    router.refresh();
  }

  function chooseCreationMode(next: DebtCreationMode) {
    setValue("creationMode", next);
    if (next === DebtCreationMode.EXISTING_BALANCE) setValue("accountId", null);
    setErrorCode(null);
  }

  const review = handleSubmit(() => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    setErrorCode(null);
    setIsConfirming(true);
  });

  const submit = handleSubmit((values) => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await createDebtAction({
        counterparty: values.counterparty,
        direction: values.direction,
        creationMode: values.creationMode,
        financialScope: values.financialScope,
        principalAmount: values.principalAmount,
        startDate: values.startDate,
        dueDate: values.dueDate,
        note: values.note?.trim() || undefined,
        accountId: moneyMovesNow ? values.accountId : null,
        idempotencyKey: createDebtIdempotencyKey(
          DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
        ),
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        if (moneyMovesNow && result.transactionId) {
          setReceipt({
            transactionId: result.transactionId,
            direction: values.direction,
            amount: values.principalAmount,
            accountName:
              accounts.find((account) => account.id === values.accountId)
                ?.name ?? "",
            effectiveDate: values.startDate,
            idempotentReplay: result.idempotentReplay ?? false,
          });
          setIsConfirming(false);
          return;
        }
        finish();
        return;
      }
      setErrorCode(result.code);
    });
  });

  const selectedAccountName =
    accounts.find((account) => account.id === accountId)?.name ?? "";

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-create-open"
        isDisabled={!online}
        onPress={() => handleOpenChange(true)}
      >
        {t("add")}
      </Button>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{t("create.title")}</Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
          {receipt ? (
            <TransactionReceipt
              title={t("create.receipt.title")}
              outcome={
                receipt.idempotentReplay
                  ? t("create.receipt.replay")
                  : t("create.receipt.outcome")
              }
              rows={[
                {
                  id: "direction",
                  label: t("create.receipt.direction"),
                  value:
                    receipt.direction === DebtDirection.BORROWED
                      ? t("create.preview.borrowed")
                      : t("create.preview.lent"),
                  kind: "text",
                },
                {
                  id: "amount",
                  label: t("create.receipt.amount"),
                  value: formatCurrency(receipt.amount, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                  kind: "financial",
                },
                {
                  id: "account",
                  label:
                    receipt.direction === DebtDirection.BORROWED
                      ? t("create.receiveInto")
                      : t("create.lendFrom"),
                  value: receipt.accountName,
                  kind: "text",
                },
                {
                  id: "date",
                  label: t("create.receipt.date"),
                  value: formatDate(
                    new Date(`${receipt.effectiveDate}T00:00:00Z`),
                    locale,
                    { day: "2-digit", month: "2-digit", year: "numeric" },
                  ),
                  kind: "text",
                },
                {
                  id: "remaining",
                  label: t("create.receipt.remaining"),
                  value: formatCurrency(receipt.amount, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                  kind: "financial",
                },
              ]}
              relatedRecordsTitle={t("create.receipt.relatedTitle")}
              relatedRecords={[
                {
                  id: "transaction",
                  label: t("create.receipt.viewTransaction"),
                  href: moneyTransactionPath(receipt.transactionId),
                },
              ]}
              nextActions={[
                {
                  id: "done",
                  label: t("create.receipt.done"),
                  variant: "primary",
                  onPress: finish,
                },
              ]}
            />
          ) : isConfirming ? (
            <DebtCreationReview
              direction={direction}
              principalAmount={principalAmount}
              accountName={selectedAccountName}
              effectiveDate={startDate}
              currency={currency}
              locale={locale}
              labels={{
                title: t("create.preview.title"),
                hint: t("create.preview.hint"),
                direction: t("create.preview.direction"),
                borrowed: t("create.preview.borrowed"),
                lent: t("create.preview.lent"),
                amount: t("create.preview.amount"),
                account:
                  direction === DebtDirection.BORROWED
                    ? t("create.receiveInto")
                    : t("create.lendFrom"),
                date: t("create.preview.date"),
                meaning: t("create.preview.meaning"),
                borrowedMeaning: t("create.preview.borrowedMeaning"),
                lentMeaning: t("create.preview.lentMeaning"),
              }}
            />
          ) : (
            <>
              <FormGroupLabel>{t("create.relationship")}</FormGroupLabel>
              <FinancialScopeField
                value={financialScope ?? FINANCIAL_SCOPE.HOUSEHOLD}
                onChange={(next) => setValue("financialScope", next)}
                testId="debt-financial-scope"
              />
              <div role="radiogroup" aria-label={t("create.relationship")}>
                <ChoiceTileGroup className="rounded-(--radius-control) bg-surface-muted p-1">
                  <ChoiceTile
                    label={t("create.borrowed")}
                    icon={
                      <IconContainer
                        tone={
                          direction === DebtDirection.BORROWED
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                      </IconContainer>
                    }
                    selected={direction === DebtDirection.BORROWED}
                    role="radio"
                    onPress={() => chooseDirection(DebtDirection.BORROWED)}
                  />
                  <ChoiceTile
                    label={t("create.lent")}
                    icon={
                      <IconContainer
                        tone={
                          direction === DebtDirection.LENT
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        <AppIcon icon={FINANCE_ICONS.income} size="sm" />
                      </IconContainer>
                    }
                    selected={direction === DebtDirection.LENT}
                    role="radio"
                    onPress={() => chooseDirection(DebtDirection.LENT)}
                  />
                </ChoiceTileGroup>
              </div>
              <FormGroupLabel>{t("create.whoAndAmount")}</FormGroupLabel>
              <TextField
                id="debt-counterparty"
                label={
                  direction === DebtDirection.BORROWED
                    ? t("create.borrowedCounterparty")
                    : t("create.lentCounterparty")
                }
                registration={register("counterparty")}
                error={
                  errors.counterparty
                    ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                    : undefined
                }
              />
              <Controller
                control={control}
                name="principalAmount"
                render={({ field, fieldState }) => (
                  <AmountField
                    id="debt-principal"
                    label={t("create.principal")}
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
              <FormGroupLabel>{t("create.recordingMode")}</FormGroupLabel>
              <div role="radiogroup" aria-label={t("create.recordingMode")}>
                <ChoiceTileGroup className="rounded-(--radius-control) bg-surface-muted p-1">
                  <ChoiceTile
                    label={t("create.existing")}
                    icon={
                      <IconContainer
                        tone={
                          creationMode === DebtCreationMode.EXISTING_BALANCE
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                      </IconContainer>
                    }
                    selected={
                      creationMode === DebtCreationMode.EXISTING_BALANCE
                    }
                    role="radio"
                    onPress={() =>
                      chooseCreationMode(DebtCreationMode.EXISTING_BALANCE)
                    }
                  />
                  <ChoiceTile
                    label={t("create.moneyMoved")}
                    icon={
                      <IconContainer
                        tone={
                          creationMode === DebtCreationMode.MONEY_MOVED
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        <AppIcon icon={FINANCE_ICONS.transfer} size="sm" />
                      </IconContainer>
                    }
                    selected={creationMode === DebtCreationMode.MONEY_MOVED}
                    role="radio"
                    onPress={() =>
                      chooseCreationMode(DebtCreationMode.MONEY_MOVED)
                    }
                  />
                </ChoiceTileGroup>
              </div>
              {moneyMovesNow ? (
                accountsLoadFailed ? (
                  <StatusAlert
                    variant="danger"
                    title={t("create.accountsLoadError")}
                    description={t("create.accountsLoadErrorDescription")}
                    action={
                      <Button
                        variant="tertiary"
                        onPress={() => router.refresh()}
                        data-testid="debt-account-retry"
                      >
                        {t("create.retryAccounts")}
                      </Button>
                    }
                    data-testid="debt-account-load-error"
                  />
                ) : accounts.length === 0 ? (
                  <StatusAlert
                    variant="warning"
                    title={t("create.noAccounts")}
                    description={t("create.noAccountsDescription")}
                    data-testid="debt-account-empty"
                  />
                ) : (
                  <Controller
                    control={control}
                    name="accountId"
                    render={({ field, fieldState }) => (
                      <SelectField
                        id="debt-account"
                        label={
                          direction === DebtDirection.BORROWED
                            ? t("create.receiveInto")
                            : t("create.lendFrom")
                        }
                        value={field.value ?? ""}
                        onChange={(next) => field.onChange(next || null)}
                        onBlur={field.onBlur}
                        placeholder={t("create.chooseAccount")}
                        options={accounts.map((account) => ({
                          id: account.id,
                          textValue: account.name,
                          label: (
                            <span className="flex min-w-0 flex-1 items-center justify-between gap-(--space-3)">
                              <span className="truncate">{account.name}</span>
                              <span className="shrink-0 text-xs text-text-secondary">
                                {t("create.availableBalance")}{" "}
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
                )
              ) : null}
              <FormGroupLabel>{t("create.timing")}</FormGroupLabel>
              <Controller
                control={control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <DatePickerField
                    id="debt-start-date"
                    label={t("create.startDate")}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    required
                    error={
                      fieldState.error
                        ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                        : undefined
                    }
                    data-testid="debt-start-date"
                  />
                )}
              />
              <Controller
                control={control}
                name="dueDate"
                render={({ field, fieldState }) => (
                  <DatePickerField
                    id="debt-due-date"
                    label={t("create.dueDate")}
                    value={field.value ?? ""}
                    onChange={(next) => field.onChange(next || null)}
                    onBlur={field.onBlur}
                    minValue={startDate || undefined}
                    error={
                      fieldState.error
                        ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                        : undefined
                    }
                    data-testid="debt-due-date"
                  />
                )}
              />
              <FormGroupLabel>{t("create.optionalDetails")}</FormGroupLabel>

              <TextField
                id="debt-note"
                label={t("create.note")}
                registration={register("note")}
              />
            </>
          )}
        </ActionSheetLayout.Body>
        {!receipt ? (
          <SheetActionFooter
            secondaryLabel={isConfirming ? t("create.back") : t("cancel")}
            primaryLabel={
              isPending
                ? t("saving")
                : isConfirming
                  ? t("create.confirm")
                  : t("create.save")
            }
            primaryTestId="debt-create-submit"
            isDisabled={!online || (moneyMovesNow && accounts.length === 0)}
            isPending={isPending}
            onSecondary={() =>
              isConfirming ? setIsConfirming(false) : handleOpenChange(false)
            }
            onPrimary={moneyMovesNow && !isConfirming ? review : submit}
          />
        ) : null}
      </ActionSheetLayout>
    </Sheet>
  );
}

function FormGroupLabel({ children }: { children: string }) {
  return (
    <Text size="sm" weight="medium" className="text-text-primary">
      {children}
    </Text>
  );
}

function DebtCreationReview({
  direction,
  principalAmount,
  accountName,
  effectiveDate,
  currency,
  locale,
  labels,
}: {
  direction: DebtDirection;
  principalAmount: number | undefined;
  accountName: string;
  effectiveDate: string | undefined;
  currency: string;
  locale: string;
  labels: {
    title: string;
    hint: string;
    direction: string;
    borrowed: string;
    lent: string;
    amount: string;
    account: string;
    date: string;
    meaning: string;
    borrowedMeaning: string;
    lentMeaning: string;
  };
}) {
  if (principalAmount == null || effectiveDate == null) return null;
  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="debt-create-preview"
    >
      <div>
        <Text size="sm" weight="medium" className="text-text-primary">
          {labels.title}
        </Text>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {labels.hint}
        </Text>
      </div>
      <ConfirmSummary
        rows={[
          {
            id: "direction",
            label: labels.direction,
            value:
              direction === DebtDirection.BORROWED
                ? labels.borrowed
                : labels.lent,
            kind: "text",
          },
          {
            id: "amount",
            label: labels.amount,
            value: formatCurrency(principalAmount, currency, locale, {
              maximumFractionDigits: 0,
            }),
            kind: "financial",
          },
          {
            id: "account",
            label: labels.account,
            value: accountName,
            kind: "text",
          },
          {
            id: "date",
            label: labels.date,
            value: formatDate(new Date(`${effectiveDate}T00:00:00Z`), locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            kind: "text",
          },
          {
            id: "meaning",
            label: labels.meaning,
            value:
              direction === DebtDirection.BORROWED
                ? labels.borrowedMeaning
                : labels.lentMeaning,
            kind: "text",
          },
        ]}
      />
    </div>
  );
}
