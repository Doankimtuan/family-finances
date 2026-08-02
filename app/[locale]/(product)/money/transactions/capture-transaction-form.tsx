"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type {
  CaptureJarOption,
  CategoryTag,
  LedgerAccount,
  TransactionDirection,
} from "@/modules/ledger/application";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { recordTransactionAction } from "./actions";
import { Link } from "@/i18n/navigation";

type Props = {
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
  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [jarId, setJarId] = useState("");
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const tags = direction === "income" ? incomeTags : expenseTags;

  const parsedAmount = useMemo(() => {
    const digits = amount.replace(/[^\d]/g, "");
    if (!digits) return null;
    const value = Number(digits);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [amount]);

  const onSubmit = () => {
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
      const result = await recordTransactionAction({
        accountId,
        type: direction,
        amount: parsedAmount,
        note: note.trim() || undefined,
        categoryId: categoryId || null,
        jarId: jarId || null,
        idempotencyKey,
      });

      if (result.status === "success") {
        if (result.inboxItemId) {
          router.push(APP_PATH.INBOX);
          router.refresh();
          return;
        }
        router.push(APP_PATH.MONEY);
        router.refresh();
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
          {(["expense", "income"] as const).map((value) => (
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

      <TextField
        id={amountId}
        label={t("amountLabel")}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
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
        <Text size="sm" tone="secondary">
          {direction === "expense" ? t("jarHintExpense") : t("jarHintIncome")}
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
