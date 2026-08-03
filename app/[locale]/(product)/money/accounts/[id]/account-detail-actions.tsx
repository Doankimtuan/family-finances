"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  ACCOUNT_TYPE_VALUES,
  AccountType,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";
import { updateAccountAction, archiveAccountAction } from "../actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  accountId: string;
  initialName: string;
  initialType: AccountTypeValue;
};

const TYPES = ACCOUNT_TYPE_VALUES;

function resolveEditableType(value: AccountTypeValue): AccountTypeValue {
  return TYPES.includes(value) ? value : AccountType.CASH;
}

/**
 * Edit name/type and archive with destructive confirmation (money.account-detail).
 */
export function AccountDetailActions({
  accountId,
  initialName,
  initialType,
}: Props) {
  const t = useTranslations("money.accountDetail");
  const tTypes = useTranslations("money.types");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [mode, setMode] = useState<"idle" | "edit" | "archive">("idle");
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<AccountTypeValue>(
    resolveEditableType(initialType),
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (mode === "archive") {
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="account-archive-confirm"
      >
        {errorCode ? (
          <StatusAlert
            variant="danger"
            title={t("archive")}
            description={t(`errors.${errorCode}`)}
          />
        ) : (
          <StatusAlert
            variant="danger"
            title={t("archiveConfirmTitle")}
            description={t("archiveConfirmBody")}
          />
        )}
        <Button
          variant="primary"
          className="w-full"
          data-testid="account-archive-confirm-yes"
          isDisabled={isPending || !online}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            startTransition(async () => {
              const result = await archiveAccountAction({ accountId });
              if (result.status === "success") {
                router.replace(APP_PATH.MONEY_ACCOUNTS);
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("archiving") : t("archiveConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => {
            setMode("idle");
            setErrorCode(null);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div
        className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
        data-testid="account-edit-form"
      >
        <Text size="sm" className="font-semibold text-text-primary">
          {t("editTitle")}
        </Text>
        {errorCode ? (
          <StatusAlert
            variant="danger"
            title={t("edit")}
            description={t(`errors.${errorCode}`)}
          />
        ) : null}
        <TextField
          id="account-edit-name"
          label={t("nameLabel")}
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
                name="accountEditType"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="size-4 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-text-primary">{tTypes(value)}</span>
            </label>
          ))}
        </fieldset>
        <Button
          variant="primary"
          className="w-full"
          data-testid="account-edit-submit"
          isDisabled={isPending || !online}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            startTransition(async () => {
              const result = await updateAccountAction({
                accountId,
                name: name.trim(),
                type,
              });
              if (result.status === "success") {
                setMode("idle");
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("editing") : t("saveEdit")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => {
            setName(initialName);
            setType(resolveEditableType(initialType));
            setMode("idle");
            setErrorCode(null);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-2)"
      data-testid="account-actions"
    >
      <Button
        variant="secondary"
        className="w-full"
        data-testid="account-edit-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setMode("edit");
        }}
      >
        {t("edit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        data-testid="account-archive-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setMode("archive");
        }}
      >
        {t("archive")}
      </Button>
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("edit")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
    </div>
  );
}
