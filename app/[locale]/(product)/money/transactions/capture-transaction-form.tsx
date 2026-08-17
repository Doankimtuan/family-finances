"use client";

import { useId, useState, useTransition } from "react";
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
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
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
  const amountId = useId();
  const noteId = useId();
  const dateId = useId();
  const [direction, setDirection] =
    useState<TransactionDirection>(initialDirection);
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const [amount, setAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [jarId, setJarId] = useState("");
  const [selectedTransactionTagIds, setSelectedTransactionTagIds] = useState<
    string[]
  >([]);
  const [tagAssignmentFailed, setTagAssignmentFailed] = useState(false);
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayInputValue);
  const [errorCode, setErrorCode] = useState<
    | ProductActionErrorCode
    | ClientActionErrorCode
    | LedgerActionErrorCode
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [receipt, setReceipt] = useState<{
    transactionId: string;
    inboxItemId: string | null;
  } | null>(null);

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const selectedAccountName = selectedAccount
    ? localizeCatalogName(tCatalog, "accounts", selectedAccount.name)
    : "";
  const selectedCategory = tags.find((tag) => tag.id === categoryId);
  const selectedJar = jars.find((jar) => jar.id === jarId);
  const amountLabel =
    amount != null && amount > 0
      ? formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 })
      : null;

  const resetForm = () => {
    setAmount(null);
    setAccountId(accounts[0]?.id ?? "");
    setCategoryId("");
    setJarId("");
    setSelectedTransactionTagIds([]);
    setTagAssignmentFailed(false);
    setNote("");
    setTransactionDate(todayInputValue());
    setErrorCode(null);
    setReceipt(null);
    setIdempotencyKey(crypto.randomUUID());
  };

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!accountId) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.NO_ACCOUNT);
      return;
    }
    if (amount == null || amount <= 0) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      document.getElementById(amountId)?.focus();
      return;
    }

    startTransition(async () => {
      const result = await recordTransactionAction({
        accountId,
        type: direction,
        amount,
        transactionDate,
        note: note.trim() || undefined,
        categoryId: categoryId || null,
        jarId: jarId || null,
        idempotencyKey,
      });

      if (result.status === "success") {
        if (selectedTransactionTagIds.length > 0) {
          const tagResult = await setTransactionTagsAction(
            result.transactionId,
            selectedTransactionTagIds,
          );
          setTagAssignmentFailed(tagResult.status === "error");
        }
        setReceipt({
          transactionId: result.transactionId,
          inboxItemId: result.inboxItemId,
        });
        return;
      }
      setErrorCode(result.code);
    });
  };

  if (receipt && amount != null && amount > 0) {
    const formattedAmount = formatCurrency(amount, currency, locale, {
      maximumFractionDigits: 0,
    });
    const signedAmount =
      direction === Direction.EXPENSE
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
            value: selectedAccountName || "—",
          },
          {
            id: "category",
            label: t("receipt.category"),
            value: selectedCategory
              ? localizeCatalogName(tCatalog, "tags", selectedCategory.name)
              : t("tagNone"),
          },
          {
            id: "jar",
            label: t("receipt.jar"),
            value: selectedJar
              ? localizeCatalogName(tCatalog, "jars", selectedJar.name)
              : t("jarUnmapped"),
          },
          {
            id: "note",
            label: t("receipt.note"),
            value: note.trim() || "—",
          },
          { id: "date", label: t("receipt.date"), value: transactionDate },
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
        {tagAssignmentFailed ? (
          <StatusAlert variant="warning" title={t("tagAssignmentFailed")} />
        ) : null}
        <div className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)">
          <Text size="sm" className="font-medium text-text-primary">
            {direction === Direction.EXPENSE
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
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="money-capture-form"
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

      <div className="rounded-xl border border-accent/25 bg-accent/10 p-(--space-4) shadow-[var(--elevation-1)]">
        <AmountField
          id={amountId}
          label={t("amountLabel")}
          placeholder="0"
          value={amount}
          onValueChange={setAmount}
          required
          data-testid="capture-amount"
          description={t("amountHint", { currency })}
          className="min-h-14 text-2xl font-semibold tabular-nums tracking-tight"
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
                  setDirection(value);
                  setCategoryId("");
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
                  name="capture-account"
                  value={account.id}
                  checked={accountId === account.id}
                  onChange={() => setAccountId(account.id)}
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
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
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
            aria-pressed={categoryId === ""}
            className={
              categoryId === ""
                ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                : "min-h-11 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            }
            onClick={() => setCategoryId("")}
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
                setCategoryId(tag.id);
                if (tag.jarId) setJarId(tag.jarId);
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
          onChange={setSelectedTransactionTagIds}
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
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
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
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
          variant="primary"
          className="w-full"
          data-testid="capture-save"
          isDisabled={isPending || !online || accounts.length === 0}
          onPress={onSubmit}
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
    </div>
  );
}
