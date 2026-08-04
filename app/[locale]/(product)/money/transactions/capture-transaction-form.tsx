"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  TransactionDirection,
} from "@/modules/ledger/application/client";
import {
  TransactionDirection as Direction,
  TRANSACTION_DIRECTION_OPTIONS,
} from "@/modules/ledger/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ClientActionErrorCode,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/client";
import { recordTransactionAction } from "./actions";
import { Link } from "@/i18n/navigation";

type Props = {
  accounts: LedgerAccount[];
  expenseTags: CategoryTag[];
  incomeTags: CategoryTag[];
  jars: CaptureJarOption[];
  currency: string;
};
/**
 * Fast capture form — amount, direction, account, tags, note (money.transaction-add).
 */
export function CaptureTransactionForm({
  accounts,
  expenseTags,
  incomeTags,
  jars,
  currency,
}: Props) {
  const t = useTranslations("money.captureForm");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const amountId = useId();
  const noteId = useId();
  const [direction, setDirection] = useState<TransactionDirection>(
    Direction.EXPENSE,
  );
  const tags = direction === Direction.INCOME ? incomeTags : expenseTags;
  const [amount, setAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [jarId, setJarId] = useState("");
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<
    | ProductActionErrorCode
    | ClientActionErrorCode
    | LedgerActionErrorCode
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

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
      return;
    }

    startTransition(async () => {
      const result = await recordTransactionAction({
        accountId,
        type: direction,
        amount,
        note: note.trim() || undefined,
        categoryId: categoryId || null,
        jarId: jarId || null,
        idempotencyKey,
      });

      if (result.status === "success") {
        // replace only — push+refresh races and can leave isPending stuck
        router.replace(result.inboxItemId ? APP_PATH.INBOX : APP_PATH.MONEY);
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="money-capture-form"
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
          {TRANSACTION_DIRECTION_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={direction === value}
              data-testid={`capture-direction-${value}`}
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

      <AmountField
        id={amountId}
        label={t("amountLabel")}
        placeholder="0"
        value={amount}
        onValueChange={setAmount}
        required
        data-testid="capture-amount"
        description={t("amountHint", { currency })}
      />

      <fieldset className="flex flex-col gap-(--space-2)">
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
                className="flex min-h-11 cursor-pointer items-center gap-(--space-3) rounded-md border border-border-subtle bg-surface px-(--space-3)"
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

      <fieldset className="flex flex-col gap-(--space-2)">
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
                  : "min-h-11 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("jarLabel")}
        </legend>
        <Text size="sm" tone="secondary">
          {direction === Direction.EXPENSE
            ? t("jarHintExpense")
            : t("jarHintIncome")}
        </Text>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
          data-testid="capture-jar"
          aria-label={t("jarLabel")}
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
        id={noteId}
        label={t("noteLabel")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("notePlaceholder")}
        data-testid="capture-note"
      />

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
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("cancel")}
      </Link>
    </div>
  );
}
