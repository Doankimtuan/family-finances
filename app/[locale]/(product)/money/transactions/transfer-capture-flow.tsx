"use client";

import { useId, useState, useTransition } from "react";
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
} from "@/modules/ledger/application/client";
import { AmountField } from "@/shared/patterns/amount-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
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
  ProductActionStatus,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { recordTransferAction } from "./actions";
import { TransactionReceipt } from "./transaction-receipt";
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
    LIQUID_SET.has(account.type) &&
    account.type !== AccountType.CREDIT_CARD &&
    account.type !== AccountType.SAVINGS_PRODUCT
  );
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
  const dateId = useId();

  const eligible = accounts.filter(isTransferEligible);
  const [amount, setAmount] = useState<number | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState(eligible[0]?.id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(
    eligible[1]?.id ?? eligible[0]?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate);
  const [step, setStep] = useState<MoneyPaymentFlowStep>(
    MoneyPaymentFlowStep.FORM,
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    sourceTransactionId: string;
    destinationTransactionId: string;
    transferGroupId: string;
    sourceDelta: number;
    destinationDelta: number;
    amount: number;
    sourceName: string;
    destinationName: string;
    date: string;
  } | null>(null);

  const sourceAccount = eligible.find((a) => a.id === sourceAccountId);
  const destinationAccount = eligible.find(
    (a) => a.id === destinationAccountId,
  );
  const sourceName = sourceAccount
    ? localizeCatalogName(tCatalog, "accounts", sourceAccount.name)
    : "";
  const destinationName = destinationAccount
    ? localizeCatalogName(tCatalog, "accounts", destinationAccount.name)
    : "";
  const amountLabel =
    amount != null && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : null;

  const resetForm = () => {
    setAmount(null);
    setSourceAccountId(eligible[0]?.id ?? "");
    setDestinationAccountId(eligible[1]?.id ?? eligible[0]?.id ?? "");
    setNote("");
    setTransactionDate(todayIsoDate());
    setErrorCode(null);
    setReceipt(null);
    setIdempotencyKey(null);
    setStep(MoneyPaymentFlowStep.FORM);
  };

  const goConfirm = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (
      !sourceAccountId ||
      !destinationAccountId ||
      sourceAccountId === destinationAccountId
    ) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    if (amount == null || amount <= 0) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      document.getElementById(amountId)?.focus();
      return;
    }
    setIdempotencyKey(createTransferIdempotencyKey());
    setStep(MoneyPaymentFlowStep.CONFIRM);
  };

  const confirmTransfer = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (
      amount == null ||
      amount <= 0 ||
      !sourceAccountId ||
      !destinationAccountId ||
      !idempotencyKey
    ) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    startTransition(async () => {
      const result = await recordTransferAction({
        sourceAccountId,
        destinationAccountId,
        amount,
        transactionDate,
        note: note.trim() || undefined,
        idempotencyKey,
      });

      if (result.status === ProductActionStatus.SUCCESS) {
        setReceipt({
          sourceTransactionId: result.sourceTransactionId,
          destinationTransactionId: result.destinationTransactionId,
          transferGroupId: result.transferGroupId,
          sourceDelta: result.sourceDelta,
          destinationDelta: result.destinationDelta,
          amount,
          sourceName,
          destinationName,
          date: transactionDate,
        });
        setStep(MoneyPaymentFlowStep.RECEIPT);
        return;
      }
      setErrorCode(result.code);
      setStep(MoneyPaymentFlowStep.FORM);
    });
  };

  if (step === MoneyPaymentFlowStep.RECEIPT && receipt && amountLabel) {
    return (
      <TransactionReceipt
        title={t("receipt.title")}
        outcome={t("receipt.outcome")}
        rows={[
          {
            id: "amount",
            label: t("receipt.amount"),
            value: amountLabel,
          },
          {
            id: "from",
            label: t("receipt.from"),
            value: receipt.sourceName,
          },
          {
            id: "to",
            label: t("receipt.to"),
            value: receipt.destinationName,
          },
          {
            id: "date",
            label: t("receipt.date"),
            value: receipt.date,
          },
          {
            id: "sourceDelta",
            label: t("receipt.sourceDelta"),
            value: `−${formatCurrency(Math.abs(receipt.sourceDelta), currency, locale, { maximumFractionDigits: 0 })}`,
          },
          {
            id: "destinationDelta",
            label: t("receipt.destinationDelta"),
            value: `+${formatCurrency(Math.abs(receipt.destinationDelta), currency, locale, { maximumFractionDigits: 0 })}`,
          },
          {
            id: "neutrality",
            label: t("receipt.householdTotal"),
            value: t("receipt.unchanged"),
          },
        ]}
        relatedRecordsTitle={t("receipt.relatedTitle")}
        relatedRecords={[
          {
            id: "source-tx",
            label: t("receipt.viewSource"),
            href: moneyTransactionPath(receipt.sourceTransactionId),
          },
          {
            id: "dest-tx",
            label: t("receipt.viewDestination"),
            href: moneyTransactionPath(receipt.destinationTransactionId),
          },
        ]}
        nextActions={[
          {
            id: "view",
            label: t("receipt.viewSource"),
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
            variant: "secondary",
          },
        ]}
      >
        <div
          className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)"
          data-testid="transfer-receipt-neutrality"
        >
          <Text size="sm" className="font-medium text-text-primary">
            {t("receipt.neutralityBody")}
          </Text>
        </div>
      </TransactionReceipt>
    );
  }

  if (step === MoneyPaymentFlowStep.CONFIRM && amountLabel) {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
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
      className="flex flex-col gap-(--space-4)"
      data-testid="money-transfer-form"
    >
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

      <div className="rounded-xl border border-accent/25 bg-accent/10 p-(--space-4)">
        <AmountField
          id={amountId}
          label={t("amountLabel")}
          placeholder="0"
          value={amount}
          onValueChange={setAmount}
          required
          data-testid="transfer-amount"
          description={t("amountHint", { currency })}
          className="min-h-14 text-2xl font-semibold tabular-nums tracking-tight"
        />
      </div>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("fromLabel")}
        </legend>
        {eligible.length < 2 ? (
          <StatusAlert
            variant="warning"
            title={t("errors.need_two_accounts")}
            description={t("needTwoAccountsHint")}
          />
        ) : (
          <div className="flex flex-col gap-(--space-2)">
            {eligible.map((account) => (
              <label
                key={account.id}
                className="flex min-h-11 cursor-pointer items-center gap-(--space-3) rounded-md border border-border-subtle bg-canvas px-(--space-3) has-[:checked]:border-accent/40 has-[:checked]:bg-accent/10"
              >
                <input
                  type="radio"
                  name="transfer-source"
                  value={account.id}
                  checked={sourceAccountId === account.id}
                  onChange={() => setSourceAccountId(account.id)}
                  className="size-4 accent-[var(--color-accent)]"
                  data-testid={`transfer-source-${account.id}`}
                />
                <span className="text-sm text-text-primary">
                  {localizeCatalogName(tCatalog, "accounts", account.name)}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("toLabel")}
        </legend>
        <div className="flex flex-col gap-(--space-2)">
          {eligible.map((account) => (
            <label
              key={account.id}
              className="flex min-h-11 cursor-pointer items-center gap-(--space-3) rounded-md border border-border-subtle bg-canvas px-(--space-3) has-[:checked]:border-accent/40 has-[:checked]:bg-accent/10"
            >
              <input
                type="radio"
                name="transfer-destination"
                value={account.id}
                checked={destinationAccountId === account.id}
                onChange={() => setDestinationAccountId(account.id)}
                className="size-4 accent-[var(--color-accent)]"
                data-testid={`transfer-destination-${account.id}`}
              />
              <span className="text-sm text-text-primary">
                {localizeCatalogName(tCatalog, "accounts", account.name)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2) rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("receipt.date")}
        </legend>
        <input
          id={dateId}
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="transfer-date"
        />
      </fieldset>

      <div className="rounded-xl border border-border-subtle bg-surface p-(--space-4)">
        <TextField
          id={noteId}
          label={t("noteLabel")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("notePlaceholder")}
          data-testid="transfer-note"
        />
      </div>

      <div
        className="rounded-xl border border-accent/25 bg-accent/10 px-(--space-4) py-(--space-3)"
        aria-live="polite"
        data-testid="transfer-preview"
      >
        <Text size="sm" weight="medium">
          {t("previewTitle")}
        </Text>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {amountLabel && sourceName && destinationName
            ? t("previewReady", {
                amount: amountLabel,
                from: sourceName,
                to: destinationName,
              })
            : t("previewEmpty")}
        </Text>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {t("previewNeutrality")}
        </Text>
      </div>

      <BottomActionBar>
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface text-sm font-medium text-text-primary"
          >
            {t("cancel")}
          </Link>
        )}
      </BottomActionBar>
    </div>
  );
}
