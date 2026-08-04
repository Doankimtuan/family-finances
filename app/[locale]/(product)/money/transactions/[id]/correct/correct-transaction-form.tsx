"use client";

import { useId, useState, useTransition } from "react";
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
} from "@/modules/ledger/application/client";
import {
  TransactionDirection as Direction,
  TRANSACTION_DIRECTION_OPTIONS,
  LEDGER_ACTION_ERROR_CODE,
} from "@/modules/ledger/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { correctTransactionAction } from "../../mutate-actions";

type CorrectFormError =
  | ProductActionErrorCode
  | ClientActionErrorCode
  | typeof LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID
  | typeof LEDGER_ACTION_ERROR_CODE.CREDIT_LIMIT_EXCEEDED
  | typeof LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED
  | typeof LEDGER_ACTION_ERROR_CODE.REFUND_INVALID
  | typeof LEDGER_ACTION_ERROR_CODE.IMMUTABLE;

type Props = {
  transaction: LedgerTransaction;
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  currency: string;
};

/**
 * 3-way correction form — Original stays Reversed; new legs append (BR-03).
 */
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
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const noteId = useId();
  const [direction, setDirection] = useState<TransactionDirection>(
    transaction.type,
  );
  const [amount, setAmount] = useState<number | null>(transaction.amount);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [jarId, setJarId] = useState(transaction.jarId ?? "");
  const [note, setNote] = useState(transaction.note ?? "");
  const [confirm, setConfirm] = useState(false);
  const [errorCode, setErrorCode] = useState<CorrectFormError | null>(null);
  const [isPending, startTransition] = useTransition();

  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;

  const runCorrect = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!accountId || amount == null || amount <= 0) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    startTransition(async () => {
      const result = await correctTransactionAction({
        originalTransactionId: transaction.id,
        amount,
        type: direction,
        accountId,
        categoryId: categoryId || null,
        jarId: jarId || null,
        note: note.trim() || undefined,
      });
      if (result.status === "success" && result.correctionTransactionId) {
        router.replace(moneyTransactionPath(result.correctionTransactionId));
        router.refresh();
        return;
      }
      if (result.status === "error") {
        setErrorCode(result.code as CorrectFormError);
      }
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="money-correct-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("title")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <StatusAlert
        variant="info"
        title={t("chainHintTitle")}
        description={t("chainHintBody")}
      />

      <div className="flex gap-(--space-2)">
        {TRANSACTION_DIRECTION_OPTIONS.map((option) => (
          <Button
            key={option}
            variant={direction === option ? "primary" : "secondary"}
            className="flex-1"
            onPress={() => setDirection(option)}
          >
            {t(`direction.${option}`)}
          </Button>
        ))}
      </div>

      <AmountField
        id={amountId}
        label={t("amountLabel")}
        description={t("amountHint", { currency })}
        value={amount}
        onValueChange={setAmount}
      />

      <label className="flex flex-col gap-(--space-2)">
        <span className="text-sm font-medium text-text-primary">
          {t("accountLabel")}
        </span>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {localizeCatalogName(tCatalog, "accounts", account.name) ||
                account.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-(--space-2)">
        <span className="text-sm font-medium text-text-primary">
          {t("tagLabel")}
        </span>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={categoryId}
          onChange={(e) => {
            const next = e.target.value;
            setCategoryId(next);
            const tag = tags.find((item) => item.id === next);
            if (tag?.jarId) setJarId(tag.jarId);
          }}
        >
          <option value="">{t("tagNone")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {localizeCatalogName(tCatalog, "tags", tag.name) || tag.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-(--space-2)">
        <span className="text-sm font-medium text-text-primary">
          {t("jarLabel")}
        </span>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
        >
          <option value="">{t("jarUnmapped")}</option>
          {jars.map((jar) => (
            <option key={jar.id} value={jar.id}>
              {localizeCatalogName(tCatalog, "jars", jar.name) || jar.name}
            </option>
          ))}
        </select>
      </label>

      <TextField
        id={noteId}
        label={t("noteLabel")}
        placeholder={t("notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {confirm ? (
        <div className="flex flex-col gap-(--space-2) rounded-lg border border-border-subtle p-(--space-3)">
          <StatusAlert
            variant="warning"
            title={t("confirmTitle")}
            description={t("confirmBody")}
          />
          <Button
            variant="primary"
            className="w-full"
            data-testid="correct-confirm"
            isDisabled={isPending || !online}
            onPress={runCorrect}
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
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          data-testid="correct-submit"
          isDisabled={isPending || !online}
          onPress={() => setConfirm(true)}
        >
          {t("submit")}
        </Button>
      )}

      <Link
        href={moneyTransactionPath(transaction.id)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary"
      >
        {t("cancel")}
      </Link>
      <Link
        href={APP_PATH.MONEY_TRANSACTIONS}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm text-text-secondary"
      >
        {t("back")}
      </Link>
    </div>
  );
}
