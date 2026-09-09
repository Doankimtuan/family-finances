"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type { LedgerAccount } from "@/modules/ledger/application/client";
import {
  AccountType,
  ACCOUNT_TYPE_LIQUID_VALUES,
  MoneyPaymentFlowStep,
  createTransferIdempotencyKey,
  recordTransferInputSchema,
  type RecordTransferInput,
} from "@/modules/ledger/application/client";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { recordTransferAction } from "./actions";
import { TransactionReceipt } from "./transaction-receipt";
import { CaptureSurface } from "./capture-surface";
import {
  CAPTURE_AMOUNT_FIELD_CLASS,
  TRANSACTION_SURFACE_LINK_CLASS,
  TRANSFER_ACCOUNT_ROW_CLASS,
} from "./transaction-chrome";
import { Card } from "@/shared/patterns/card";
import { todayIsoDate } from "@/shared/utils/iso-date";

type Props = {
  accounts: LedgerAccount[];
  currency: string;
  onBackToCapture?: () => void;
};

type ErrorCode =
  | ProductActionErrorCode
  | ClientActionErrorCode
  | LedgerActionErrorCode
  | "need_two_accounts";

type TransferFormErrorKey =
  | "unauthenticated"
  | "no_membership"
  | "invalid"
  | "offline"
  | "need_two_accounts"
  | "unknown";

type TransferFormInput = RecordTransferInput;
type TransferFormValues = RecordTransferInput;

function toTransferErrorKey(code: ErrorCode): TransferFormErrorKey {
  if (
    code === PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED ||
    code === PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP ||
    code === PRODUCT_ACTION_ERROR_CODE.INVALID ||
    code === CLIENT_ACTION_ERROR_CODE.OFFLINE ||
    code === "need_two_accounts"
  ) {
    return code as TransferFormErrorKey;
  }
  return "unknown";
}

const LIQUID_SET = new Set<string>(ACCOUNT_TYPE_LIQUID_VALUES);

function isTransferEligible(account: LedgerAccount): boolean {
  return (
    !account.isArchived &&
    LIQUID_SET.has(account.type) &&
    account.type !== AccountType.CREDIT_CARD &&
    account.type !== AccountType.SAVINGS_PRODUCT
  );
}

function createDefaultValues(eligible: LedgerAccount[]): TransferFormInput {
  return {
    sourceAccountId: eligible[0]?.id ?? "",
    destinationAccountId: eligible[1]?.id ?? eligible[0]?.id ?? "",
    amount: undefined as never,
    transactionDate: todayIsoDate(),
    note: undefined,
    idempotencyKey: undefined,
  };
}

/**
 * Owned-account transfer — preview → confirm → receipt.
 * Neutral: source −amount, destination +amount; household total unchanged.
 */
export function TransferCaptureFlow({
  accounts,
  currency,
  onBackToCapture,
}: Props) {
  const t = useTranslations("money.transferForm");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const noteId = useId();

  const eligible = accounts.filter(isTransferEligible);
  const [step, setStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{
    sourceTransactionId: string;
    amount: number;
    sourceName: string;
    destinationName: string;
    date: string;
  } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(recordTransferInputSchema),
    defaultValues: createDefaultValues(eligible),
  });
  const watchedAmount = useWatch({ control, name: "amount" });
  const amount = typeof watchedAmount === "number" ? watchedAmount : null;
  const sourceAccountId = useWatch({ control, name: "sourceAccountId" });
  const destinationAccountId = useWatch({
    control,
    name: "destinationAccountId",
  });
  const transactionDate = useWatch({ control, name: "transactionDate" });

  const sourceAccount = eligible.find((a) => a.id === sourceAccountId);
  const destinationAccount = eligible.find(
    (a) => a.id === destinationAccountId,
  );
  const sourceName = sourceAccount
    ? localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, sourceAccount.name)
    : "";
  const destinationName = destinationAccount
    ? localizeCatalogName(
        tCatalog,
        CatalogGroup.ACCOUNTS,
        destinationAccount.name,
      )
    : "";
  const destinationOptions = eligible.filter(
    (account) => account.id !== sourceAccountId,
  );
  const amountLabel =
    amount != null && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : null;
  let previewMessage: ReactNode = t("previewEmpty");
  if (amountLabel && sourceName && destinationName) {
    previewMessage =
      typeof t.rich === "function"
        ? t.rich("previewReady", {
            amount: () => <FinancialValue>{amountLabel}</FinancialValue>,
            from: sourceName,
            to: destinationName,
          })
        : t("previewReady", {
            amount: FINANCIAL_PRIVACY_MASK,
            from: sourceName,
            to: destinationName,
          });
  }

  const resetForm = () => {
    reset(createDefaultValues(eligible));
    setErrorCode(null);
    setReceipt(null);
    setStep(MoneyPaymentFlowStep.FORM);
  };

  const showValidationError = () => {
    setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
  };

  const goConfirm = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void handleSubmit(() => {
      setValue("idempotencyKey", createTransferIdempotencyKey(), {
        shouldValidate: true,
      });
      setStep(MoneyPaymentFlowStep.CONFIRM);
    }, showValidationError)();
  };

  const confirmTransfer = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    void handleSubmit((values) => {
      startTransition(async () => {
        const result = await recordTransferAction(
          values satisfies RecordTransferInput,
        );

        if (result.status === ProductActionStatus.SUCCESS) {
          const submittedSource = eligible.find(
            (account) => account.id === values.sourceAccountId,
          );
          const submittedDestination = eligible.find(
            (account) => account.id === values.destinationAccountId,
          );
          setReceipt({
            sourceTransactionId: result.sourceTransactionId,
            amount: values.amount,
            sourceName: submittedSource
              ? localizeCatalogName(
                  tCatalog,
                  CatalogGroup.ACCOUNTS,
                  submittedSource.name,
                )
              : "",
            destinationName: submittedDestination
              ? localizeCatalogName(
                  tCatalog,
                  CatalogGroup.ACCOUNTS,
                  submittedDestination.name,
                )
              : "",
            date: values.transactionDate ?? todayIsoDate(),
          });
          setStep(MoneyPaymentFlowStep.RECEIPT);
          return;
        }
        setErrorCode(result.code);
        setStep(MoneyPaymentFlowStep.FORM);
      });
    }, showValidationError)();
  };

  if (step === MoneyPaymentFlowStep.RECEIPT && receipt) {
    const receiptAmountLabel = formatCurrency(
      receipt.amount,
      currency,
      locale,
      { maximumFractionDigits: 0 },
    );
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          {
            id: "amount",
            label: t("receipt.amount"),
            value: receiptAmountLabel,
          },
          {
            id: "route",
            label: t("receipt.from"),
            value: t("receipt.route", {
              from: receipt.sourceName,
              to: receipt.destinationName,
            }),
            kind: "text",
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: receipt.date,
          },
          {
            id: "neutrality",
            label: t("receipt.householdTotal"),
            value: t("receipt.unchanged"),
          },
        ]}
        nextActions={[
          {
            id: "view",
            label: t("receipt.viewTransfer"),
            href: moneyTransactionPath(receipt.sourceTransactionId),
            variant: "primary",
          },
          {
            id: "another",
            label: t("receipt.recordAnother"),
            onPress: resetForm,
            variant: "secondary",
          },
          {
            id: "money",
            label: t("receipt.goToMoney"),
            href: APP_PATH.MONEY,
            variant: "tertiary",
          },
        ]}
      >
        <CaptureSurface
          className="border-success/20 bg-success/5"
          testId="transfer-receipt-neutrality"
        >
          <Text size="sm" className="font-medium text-text-primary">
            {t("receipt.neutralityBody")}
          </Text>
        </CaptureSurface>
      </TransactionReceipt>
    );
  }

  if (step === MoneyPaymentFlowStep.CONFIRM && amountLabel) {
    return (
      <div
        className="flex flex-col gap-(--space-5)"
        data-testid="money-transfer-confirm"
      >
        {errorCode ? (
          <StatusAlert
            variant="danger"
            title={t("errorTitle")}
            description={t(`errors.${toTransferErrorKey(errorCode)}`)}
          />
        ) : null}
        <div className="flex flex-col gap-(--space-2)">
          <Text size="sm" weight="medium">
            {t("confirmTitle")}
          </Text>
          <ConfirmSummary
            className="shadow-(--elevation-1)"
            data-testid="transfer-confirm-summary"
            rows={[
              { id: "amount", label: t("receipt.amount"), value: amountLabel },
              { id: "from", label: t("fromLabel"), value: sourceName },
              { id: "to", label: t("toLabel"), value: destinationName },
              { id: "date", label: t("receipt.date"), value: transactionDate },
              {
                id: "effect",
                label: t("confirmEffect"),
                value: t("confirmEffectBody"),
              },
            ]}
          />
        </div>
        <BottomActionBar>
          <Button
            variant="primary"
            className="w-full"
            data-testid="transfer-confirm"
            isDisabled={isPending || !online}
            onPress={confirmTransfer}
          >
            {isPending ? t("confirming") : t("confirm")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="transfer-confirm-back"
            isDisabled={isPending}
            onPress={() => setStep(MoneyPaymentFlowStep.FORM)}
          >
            {t("back")}
          </Button>
        </BottomActionBar>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="money-transfer-form"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-(--space-5) overflow-y-auto overscroll-y-contain">
        {errorCode ? (
          <StatusAlert
            variant="danger"
            title={t("errorTitle")}
            description={t(`errors.${toTransferErrorKey(errorCode)}`)}
          />
        ) : null}

        {!online ? (
          <StatusAlert
            variant="warning"
            title={t("errors.offline")}
            description={t("offlineHint")}
          />
        ) : null}

        <CaptureSurface>
          <ControlledField
            control={control}
            field={{
              type: "amount",
              name: "amount",
              id: amountId,
              label: t("amountLabel", { currency }),
              placeholder: "0",
              testId: "transfer-amount",
              required: true,
              className: CAPTURE_AMOUNT_FIELD_CLASS,
            }}
            getErrorMessage={() => t("errors.invalid")}
          />
        </CaptureSurface>

        <CaptureSurface>
          <fieldset className="flex flex-col gap-(--space-3)">
            <legend className="text-sm font-semibold tracking-tight text-text-primary">
              {t("fromLabel")}
            </legend>
            {eligible.length < 2 ? (
              <StatusAlert
                variant="warning"
                title={t("errors.need_two_accounts")}
                description={t("needTwoAccountsHint")}
              />
            ) : (
              <Controller
                control={control}
                name="sourceAccountId"
                render={({ field }) => (
                  <div className="flex flex-col gap-(--space-2)">
                    {eligible.map((account) => (
                      <label
                        key={account.id}
                        className={TRANSFER_ACCOUNT_ROW_CLASS}
                      >
                        <input
                          type="radio"
                          name="transfer-source"
                          value={account.id}
                          checked={field.value === account.id}
                          onChange={() => {
                            field.onChange(account.id);
                            if (destinationAccountId === account.id) {
                              setValue(
                                "destinationAccountId",
                                eligible.find(
                                  (candidate) => candidate.id !== account.id,
                                )?.id ?? "",
                                { shouldValidate: true },
                              );
                            }
                          }}
                          className="size-4 accent-[var(--color-accent)]"
                          data-testid={`transfer-source-${account.id}`}
                        />
                        <span className="text-sm font-medium text-text-primary">
                          {localizeCatalogName(
                            tCatalog,
                            CatalogGroup.ACCOUNTS,
                            account.name,
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            )}
          </fieldset>
        </CaptureSurface>

        <CaptureSurface>
          <fieldset className="flex flex-col gap-(--space-3)">
            <legend className="text-sm font-semibold tracking-tight text-text-primary">
              {t("toLabel")}
            </legend>
            <Controller
              control={control}
              name="destinationAccountId"
              render={({ field }) => (
                <div className="flex flex-col gap-(--space-2)">
                  {destinationOptions.map((account) => (
                    <label
                      key={account.id}
                      className={TRANSFER_ACCOUNT_ROW_CLASS}
                    >
                      <input
                        type="radio"
                        name="transfer-destination"
                        value={account.id}
                        checked={field.value === account.id}
                        onChange={() => field.onChange(account.id)}
                        className="size-4 accent-[var(--color-accent)]"
                        data-testid={`transfer-destination-${account.id}`}
                      />
                      <span className="text-sm font-medium text-text-primary">
                        {localizeCatalogName(
                          tCatalog,
                          CatalogGroup.ACCOUNTS,
                          account.name,
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
          </fieldset>
        </CaptureSurface>

        <ControlledField
          control={control}
          field={{
            type: "date",
            name: "transactionDate",
            id: "transfer-date",
            label: t("effectiveDateLabel"),
            testId: "transfer-date",
          }}
          getErrorMessage={() => t("errors.invalid")}
        />

        <TextField
          id={noteId}
          label={t("noteLabel")}
          registration={register("note")}
          error={errors.note ? t("errors.invalid") : undefined}
          placeholder={t("notePlaceholder")}
          data-testid="transfer-note"
        />

        <Card
          tone="highlighted"
          className="gap-(--space-1) p-(--space-4)"
          aria-live="polite"
          data-testid="transfer-preview"
        >
          <Text size="sm" weight="medium">
            {t("previewTitle")}
          </Text>
          <Text size="sm" tone="secondary">
            {previewMessage}
          </Text>
          <Text size="sm" tone="secondary">
            {t("previewNeutrality")}
          </Text>
        </Card>
      </div>

      <BottomActionBar className="mt-auto shrink-0">
        <Button
          variant="primary"
          className="w-full"
          data-testid="transfer-preview-continue"
          isDisabled={isPending || !online || eligible.length < 2}
          onPress={goConfirm}
        >
          {t("continue")}
        </Button>
        {onBackToCapture ? (
          <Button
            variant="secondary"
            className="w-full"
            data-testid="transfer-back-capture"
            onPress={onBackToCapture}
          >
            {t("backToCapture")}
          </Button>
        ) : (
          <Link
            href={APP_PATH.MONEY}
            className={TRANSACTION_SURFACE_LINK_CLASS}
          >
            {t("cancel")}
          </Link>
        )}
      </BottomActionBar>
    </div>
  );
}
