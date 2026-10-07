"use client";

import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
import { TRANSACTION_SURFACE_LINK_CLASS } from "./transaction-chrome";
import { TransactionAccountField } from "./transaction-account-field";
import { Card } from "@/shared/patterns/card";
import { TransactionAmountField } from "./transaction-amount-field";
import { TransactionDateField } from "./transaction-date-field";
import { MoneyCaptureMode } from "@/modules/ledger/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { todayIsoDate } from "@/shared/utils/iso-date";

type Props = {
  accounts: LedgerAccount[];
  accountsReady?: boolean;
  currency: string;
  initialSourceAccountId?: string;
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

function createDefaultValues(
  eligible: LedgerAccount[],
  initialSourceAccountId?: string,
): TransferFormInput {
  const source =
    eligible.find((account) => account.id === initialSourceAccountId) ??
    eligible[0];
  const destination = eligible.find((account) => account.id !== source?.id);
  return {
    sourceAccountId: source?.id ?? "",
    destinationAccountId: destination?.id ?? source?.id ?? "",
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
  accountsReady = true,
  currency,
  initialSourceAccountId,
  onBackToCapture,
}: Props) {
  const t = useTranslations("money.transferForm");
  const tCapture = useTranslations("money.captureForm");
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
    getValues,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(recordTransferInputSchema),
    defaultValues: createDefaultValues(eligible, initialSourceAccountId),
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

  useEffect(() => {
    if (!accountsReady) return;
    const availableAccounts = accounts.filter(isTransferEligible);
    if (availableAccounts.length === 0) return;

    const currentSourceId = getValues("sourceAccountId");
    const source =
      availableAccounts.find((account) => account.id === currentSourceId) ??
      availableAccounts.find(
        (account) => account.id === initialSourceAccountId,
      ) ??
      availableAccounts[0];
    if (!source) return;

    const currentDestinationId = getValues("destinationAccountId");
    const destination =
      availableAccounts.find(
        (account) =>
          account.id === currentDestinationId && account.id !== source.id,
      ) ?? availableAccounts.find((account) => account.id !== source.id);

    if (currentSourceId !== source.id) {
      setValue("sourceAccountId", source.id, { shouldValidate: false });
    }
    if (destination && currentDestinationId !== destination.id) {
      setValue("destinationAccountId", destination.id, {
        shouldValidate: false,
      });
    }
  }, [accounts, accountsReady, getValues, initialSourceAccountId, setValue]);
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
    reset(createDefaultValues(eligible, initialSourceAccountId));
    setErrorCode(null);
    setReceipt(null);
    setStep(MoneyPaymentFlowStep.FORM);
  };

  const showValidationError = () => {
    setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
  };

  const goConfirm = () => {
    if (!accountsReady || eligible.length < 2) return;
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
              {
                id: "amount",
                label: t("receipt.amount"),
                value: amountLabel,
                kind: "financial",
              },
              {
                id: "from",
                label: t("fromLabel"),
                value: sourceName,
                kind: "text",
              },
              {
                id: "to",
                label: t("toLabel"),
                value: destinationName,
                kind: "text",
              },
              {
                id: "date",
                label: t("receipt.date"),
                value: transactionDate,
                kind: "text",
              },
              {
                id: "effect",
                label: t("confirmEffect"),
                value: t("confirmEffectBody"),
                kind: "text",
              },
            ]}
          />
        </div>
        <BottomActionBar>
          <Button
            variant="primary"
            className="w-full"
            data-testid="transfer-confirm"
            isLoading={isPending}
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
    <div className="flex flex-1 flex-col" data-testid="money-transfer-form">
      <div className="flex flex-1 flex-col gap-(--space-5)">
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

        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <TransactionAmountField
              id={amountId}
              label={t("amountLabel", { currency })}
              mode={MoneyCaptureMode.TRANSFER}
              currency={currency}
              value={typeof field.value === "number" ? field.value : null}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.amount ? t("errors.invalid") : undefined}
              required
              autoFocus
              placeholder={t("amountPlaceholder")}
              data-testid="transfer-amount"
            />
          )}
        />

        {accountsReady && eligible.length < 2 ? (
          <StatusAlert
            variant="warning"
            title={t("errors.need_two_accounts")}
            description={t("needTwoAccountsHint")}
          />
        ) : null}
        <Card
          className="gap-0 overflow-hidden p-0"
          data-testid="transfer-accounts"
        >
          <Controller
            control={control}
            name="sourceAccountId"
            render={({ field }) => (
              <TransactionAccountField
                id="transfer-source"
                label={t("fromLabel")}
                value={field.value}
                onChange={(next) => {
                  field.onChange(next);
                  if (destinationAccountId === next) {
                    setValue(
                      "destinationAccountId",
                      eligible.find((account) => account.id !== next)?.id ?? "",
                      { shouldValidate: true },
                    );
                  }
                }}
                onBlur={field.onBlur}
                required
                isDisabled={!accountsReady || eligible.length < 2}
                placeholder={
                  accountsReady ? undefined : tCapture("referencesLoading")
                }
                error={errors.sourceAccountId ? t("errors.invalid") : undefined}
                accounts={eligible}
                currency={currency}
                data-testid="transfer-source"
              />
            )}
          />
          <div
            className="relative mx-(--space-3) border-t border-border-subtle"
            aria-hidden="true"
          >
            <span className="absolute start-(--space-1) -translate-y-1/2 rounded-full border border-border-subtle bg-surface p-(--space-1) text-transfer">
              <AppIcon
                icon={ACTION_ICONS.forward}
                size="sm"
                className="rotate-90"
              />
            </span>
          </div>
          <Controller
            control={control}
            name="destinationAccountId"
            render={({ field }) => (
              <TransactionAccountField
                id="transfer-destination"
                label={t("toLabel")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                required
                isDisabled={!accountsReady || eligible.length < 2}
                placeholder={
                  accountsReady ? undefined : tCapture("referencesLoading")
                }
                error={
                  errors.destinationAccountId ? t("errors.invalid") : undefined
                }
                accounts={destinationOptions}
                currency={currency}
                data-testid="transfer-destination"
              />
            )}
          />
        </Card>
        <Controller
          control={control}
          name="transactionDate"
          render={({ field }) => (
            <TransactionDateField
              id="transfer-date"
              label={t("effectiveDateLabel")}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.transactionDate ? t("errors.invalid") : undefined}
              data-testid="transfer-date"
            />
          )}
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
          isDisabled={
            isPending ||
            !online ||
            !accountsReady ||
            eligible.length < 2 ||
            !amountLabel ||
            !sourceAccount ||
            !destinationAccount
          }
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
