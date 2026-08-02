"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  LedgerTransaction,
  TransactionDirection,
} from "@/modules/ledger/application";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "../../mutate-actions";

type Props = {
  transaction: LedgerTransaction;
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  currency: string;
};

type ErrorCode =
  | "unauthenticated"
  | "no_membership"
  | "invalid"
  | "offline"
  | "unknown"
  | "no_account";

/**
 * Edit transaction — confirm before save/delete; offline fail-closed (AC-018).
 */
export function EditTransactionForm({
  transaction,
  accounts,
  expenseTags,
  incomeTags,
  jars,
  currency,
}: Props) {
  const t = useTranslations("money.editForm");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [direction, setDirection] = useState<TransactionDirection>(
    transaction.type,
  );
  const [amount, setAmount] = useState(String(transaction.amount));
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [jarId, setJarId] = useState(transaction.jarId ?? "");
  const [note, setNote] = useState(transaction.note ?? "");
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const tags = direction === "income" ? incomeTags : expenseTags;

  const parsedAmount = useMemo(() => {
    const digits = amount.replace(/[^\d]/g, "");
    if (!digits) return null;
    const value = Number(digits);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [amount]);

  const detailHref = moneyTransactionPath(transaction.id);

  const runSave = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode("offline");
      return;
    }
    if (!accountId) {
      setErrorCode("no_account");
      return;
    }
    if (parsedAmount == null) {
      setErrorCode("invalid");
      return;
    }

    startTransition(async () => {
      const result = await updateTransactionAction({
        transactionId: transaction.id,
        accountId,
        type: direction,
        amount: parsedAmount,
        transactionDate: transaction.transactionDate,
        note: note.trim() || undefined,
        categoryId: categoryId || null,
        jarId: jarId || null,
      });
      if (result.status === "success") {
        router.push(detailHref);
        router.refresh();
        return;
      }
      setConfirmSave(false);
      setErrorCode(result.code);
    });
  };

  const runDelete = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode("offline");
      return;
    }
    startTransition(async () => {
      const result = await deleteTransactionAction({
        transactionId: transaction.id,
      });
      if (result.status === "success") {
        router.push(APP_PATH.MONEY_TRANSACTIONS);
        router.refresh();
        return;
      }
      setConfirmDelete(false);
      setErrorCode(result.code);
    });
  };

  if (confirmDelete) {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="transaction-delete-confirm"
      >
        <StatusAlert
          variant="danger"
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmBody")}
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid="transaction-delete-confirm-yes"
          isDisabled={isPending || !online}
          onPress={runDelete}
        >
          {isPending ? t("deleting") : t("deleteConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => setConfirmDelete(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  if (confirmSave) {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="transaction-save-confirm"
      >
        <StatusAlert
          variant="warning"
          title={t("saveConfirmTitle")}
          description={t("saveConfirmBody")}
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid="transaction-save-confirm-yes"
          isDisabled={isPending || !online}
          onPress={runSave}
        >
          {isPending ? t("saving") : t("saveConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => setConfirmSave(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="transaction-edit-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("save")}
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

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("directionLabel")}
        </legend>
        <div className="grid grid-cols-2 gap-(--space-2)" role="radiogroup">
          {(["expense", "income"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={direction === value}
              data-testid={`edit-direction-${value}`}
              className={
                direction === value
                  ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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

      <TextField
        id="edit-amount"
        label={t("amountLabel")}
        inputMode="numeric"
        autoComplete="off"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        data-testid="edit-amount"
        description={t("amountHint", { currency })}
      />

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("accountLabel")}
        </legend>
        <div className="flex flex-col gap-(--space-2)">
          {accounts.map((account) => (
            <label
              key={account.id}
              className="flex min-h-11 cursor-pointer items-center gap-(--space-3) rounded-md border border-border-subtle bg-surface px-(--space-3)"
            >
              <input
                type="radio"
                name="edit-account"
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
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("tagLabel")}
        </legend>
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
              className={
                categoryId === tag.id
                  ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              }
              onClick={() => setCategoryId(tag.id)}
            >
              {localizeCatalogName(tCatalog, "tags", tag.name)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("jarLabel")}
        </legend>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
          aria-label={t("jarLabel")}
          data-testid="edit-jar"
        >
          <option value="">{t("jarUnmapped")}</option>
          {jars.map((jar) => (
            <option key={jar.id} value={jar.id}>
              {localizeCatalogName(tCatalog, "jars", jar.name)}
            </option>
          ))}
        </select>
      </fieldset>

      <TextField
        id="edit-note"
        label={t("noteLabel")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("notePlaceholder")}
        data-testid="edit-note"
      />

      <Button
        variant="primary"
        className="w-full"
        data-testid="edit-save"
        isDisabled={isPending || !online}
        onPress={() => {
          setErrorCode(null);
          if (!online) {
            setErrorCode("offline");
            return;
          }
          if (parsedAmount == null) {
            setErrorCode("invalid");
            return;
          }
          setConfirmSave(true);
        }}
      >
        {t("save")}
      </Button>

      <Link
        href={detailHref}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("cancel")}
      </Link>

      <Button
        variant="secondary"
        className="w-full text-danger"
        data-testid="edit-delete"
        isDisabled={isPending || !online}
        onPress={() => {
          setErrorCode(null);
          if (!online) {
            setErrorCode("offline");
            return;
          }
          setConfirmDelete(true);
        }}
      >
        {t("delete")}
      </Button>
    </div>
  );
}
