"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AmountField } from "@/shared/patterns/amount-field";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createAccountAction } from "./actions";
import {
  AccountType,
  ACCOUNT_TYPE_CREATE_OPTIONS,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_STATEMENT_DAY,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
const TYPES = ACCOUNT_TYPE_CREATE_OPTIONS;

type LiquidOption = { id: string; name: string };

type Props = {
  liquidAccounts: LiquidOption[];
};

/**
 * Progressive add-account form: name → type → opening balance or CC settings.
 */
export function AddAccountForm({ liquidAccounts }: Props) {
  const t = useTranslations("money.accountsPage");
  const tTypes = useTranslations("money.types");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountTypeValue>(AccountType.CASH);
  const [showExtras, setShowExtras] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | null>(0);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [statementDay, setStatementDay] = useState(DEFAULT_CARD_STATEMENT_DAY);
  const [dueDay, setDueDay] = useState(DEFAULT_CARD_DUE_DAY);
  const [linkedBankAccountId, setLinkedBankAccountId] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCard = type === AccountType.CREDIT_CARD;

  const reset = () => {
    setName("");
    setType(AccountType.CASH);
    setShowExtras(false);
    setOpeningBalance(0);
    setCreditLimit(null);
    setStatementDay(DEFAULT_CARD_STATEMENT_DAY);
    setDueDay(DEFAULT_CARD_DUE_DAY);
    setLinkedBankAccountId("");
    setErrorCode(null);
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="account-add-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setOpen(true);
        }}
      >
        {online ? t("add") : t("errors.offline")}
      </Button>
    );
  }

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }

    if (isCard) {
      const limit = creditLimit ?? 0;
      if (!Number.isFinite(limit) || limit < 0 || !Number.isInteger(limit)) {
        setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
        return;
      }
      startTransition(async () => {
        const result = await createAccountAction({
          name: name.trim(),
          type: AccountType.CREDIT_CARD,
          openingBalance: 0,
          creditCard: {
            creditLimit: limit,
            statementDay,
            dueDay,
            linkedBankAccountId: linkedBankAccountId || null,
          },
        });
        if (result.status === "success") {
          setOpen(false);
          reset();
          router.refresh();
          return;
        }
        setErrorCode(result.code);
      });
      return;
    }

    const balance = openingBalance ?? 0;
    if (
      !Number.isFinite(balance) ||
      balance < 0 ||
      !Number.isInteger(balance)
    ) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    startTransition(async () => {
      const result = await createAccountAction({
        name: name.trim(),
        type,
        openingBalance: balance,
      });
      if (result.status === "success") {
        setOpen(false);
        reset();
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="account-add-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("add")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <TextField
        id="account-name"
        label={t("nameLabel")}
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <Text size="sm" className="font-semibold text-text-primary">
          {t("typeLabel")}
        </Text>
        {TYPES.map((value) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer items-center gap-(--space-3)"
          >
            <input
              type="radio"
              name="accountType"
              value={value}
              checked={type === value}
              onChange={() => {
                setType(value);
                setShowExtras(true);
              }}
              className="size-4 accent-[var(--color-accent)]"
              data-testid={
                value === AccountType.CREDIT_CARD
                  ? "account-type-credit-card"
                  : undefined
              }
            />
            <span className="text-sm text-text-primary">{tTypes(value)}</span>
          </label>
        ))}
      </fieldset>
      {showExtras && !isCard ? (
        <div className="flex flex-col gap-(--space-1)">
          <AmountField
            id="account-opening-balance"
            label={t("openingBalanceLabel")}
            value={openingBalance}
            onValueChange={setOpeningBalance}
            data-testid="account-opening-balance"
          />
          <Text size="sm" tone="secondary">
            {t("openingBalanceHint")}
          </Text>
        </div>
      ) : null}
      {showExtras && isCard ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="account-credit-card-settings"
        >
          <AmountField
            id="account-credit-limit"
            label={t("creditLimitLabel")}
            value={creditLimit}
            onValueChange={setCreditLimit}
            data-testid="account-credit-limit"
          />
          <TextField
            id="account-statement-day"
            label={t("statementDayLabel")}
            type="number"
            inputMode="numeric"
            value={String(statementDay)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setStatementDay(n);
            }}
            data-testid="account-statement-day"
          />
          <TextField
            id="account-due-day"
            label={t("dueDayLabel")}
            type="number"
            inputMode="numeric"
            value={String(dueDay)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setDueDay(n);
            }}
            data-testid="account-due-day"
          />
          <div className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold text-text-primary">
              {t("linkedBankLabel")}
            </Text>
            <select
              className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
              value={linkedBankAccountId}
              onChange={(e) => setLinkedBankAccountId(e.target.value)}
              data-testid="account-linked-bank"
            >
              <option value="">{t("linkedBankNone")}</option>
              {liquidAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <Text size="sm" tone="secondary">
            {t("creditCardHint")}
          </Text>
        </div>
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        data-testid="account-add-submit"
        isDisabled={isPending || !online}
        onPress={onSubmit}
      >
        {isPending ? t("adding") : t("add")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          setOpen(false);
          reset();
        }}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
