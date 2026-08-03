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
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
const TYPES = ACCOUNT_TYPE_CREATE_OPTIONS;

/**
 * Progressive add-account form: name → type → optional opening balance.
 */
export function AddAccountForm() {
  const t = useTranslations("money.accountsPage");
  const tTypes = useTranslations("money.types");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountTypeValue>(AccountType.CASH);
  const [showOpening, setShowOpening] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | null>(0);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setType(AccountType.CASH);
    setShowOpening(false);
    setOpeningBalance(0);
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
                setShowOpening(true);
              }}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-text-primary">{tTypes(value)}</span>
          </label>
        ))}
      </fieldset>
      {showOpening ? (
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
