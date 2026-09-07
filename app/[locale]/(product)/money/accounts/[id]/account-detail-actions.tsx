"use client";

import { useState, useTransition, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Controller, useForm } from "react-hook-form";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { SelectField, TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  AccountType,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";
import {
  updateAccountInputSchema,
  type UpdateAccountInput,
} from "@/modules/ledger/application/commands/update-account.schema";
import { updateAccountAction, archiveAccountAction } from "../actions";
import {
  ACCOUNT_DETAIL_MODE,
  type AccountDetailMode,
} from "./detail-constants";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  accountId: string;
  initialName: string;
  initialType: AccountTypeValue;
  mode: AccountDetailMode;
  onModeChange: (mode: AccountDetailMode) => void;
  children?: ReactNode;
};

const TYPES = ACCOUNT_TYPE_LIQUID_VALUES;

function resolveEditableType(value: AccountTypeValue): AccountTypeValue {
  if (value === AccountType.CREDIT_CARD) return AccountType.CREDIT_CARD;
  return TYPES.includes(value as (typeof TYPES)[number])
    ? (value as (typeof TYPES)[number])
    : AccountType.CASH;
}

/**
 * Edit name/type and archive with destructive confirmation (money.account-detail).
 */
export function AccountDetailActions({
  accountId,
  initialName,
  initialType,
  mode,
  onModeChange,
  children,
}: Props) {
  const t = useTranslations("money.accountDetail");
  const tTypes = useTranslations("money.types");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountInputSchema),
    defaultValues: {
      accountId,
      name: initialName,
      type: resolveEditableType(initialType),
    },
  });
  function resetEditForm() {
    resetForm({
      accountId,
      name: initialName,
      type: resolveEditableType(initialType),
    });
    setErrorCode(null);
  }

  function openEdit() {
    resetEditForm();
    onModeChange(ACCOUNT_DETAIL_MODE.EDIT);
  }

  const submitEdit = handleSubmit((values) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await updateAccountAction(values);
      if (result.status === "success") {
        onModeChange(ACCOUNT_DETAIL_MODE.MANAGE);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  });

  if (mode === ACCOUNT_DETAIL_MODE.ARCHIVE) {
    return (
      <>
        <ActionSheetLayout.Body>
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
          </div>
        </ActionSheetLayout.Body>
        <ActionSheetLayout.Footer>
          <Button
            variant="secondary"
            fullWidth
            className="min-w-0 flex-1"
            isDisabled={isPending}
            onPress={() => {
              onModeChange(ACCOUNT_DETAIL_MODE.MANAGE);
              setErrorCode(null);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="danger"
            fullWidth
            className="min-w-0 flex-1"
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
                  router.replace(APP_PATH.MONEY);
                  router.refresh();
                  return;
                }
                setErrorCode(result.code);
              });
            }}
          >
            {isPending ? t("archiving") : t("archiveConfirmYes")}
          </Button>
        </ActionSheetLayout.Footer>
      </>
    );
  }

  if (mode === ACCOUNT_DETAIL_MODE.EDIT) {
    return (
      <>
        <ActionSheetLayout.Body>
          <form
            onSubmit={submitEdit}
            className="flex flex-col gap-(--space-3)"
            data-testid="account-edit-form"
          >
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
              registration={register("name")}
              error={errors.name ? t("errors.invalid") : undefined}
            />
            {initialType === AccountType.CREDIT_CARD ? (
              <Text size="sm" tone="secondary">
                {tTypes(AccountType.CREDIT_CARD)}
              </Text>
            ) : (
              <Controller
                control={control}
                name="type"
                render={({ field, fieldState }) => (
                  <SelectField
                    id="account-edit-type"
                    label={t("typeLabel")}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={TYPES.map((value) => ({
                      id: value,
                      label: tTypes(value),
                    }))}
                    error={fieldState.error ? t("errors.invalid") : undefined}
                    required
                    data-testid="account-edit-type"
                  />
                )}
              />
            )}
          </form>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={isPending ? t("editing") : t("saveEdit")}
          onSecondary={() => {
            resetEditForm();
            onModeChange(ACCOUNT_DETAIL_MODE.MANAGE);
          }}
          onPrimary={() => {
            void submitEdit();
          }}
          primaryTestId="account-edit-submit"
          isDisabled={!online}
          isPending={isPending}
        />
      </>
    );
  }

  return (
    <ActionSheetLayout.Body>
      <ul
        className="divide-y divide-border-subtle/70"
        data-testid="account-actions"
      >
        <li>
          <Button
            variant="ghost"
            className="min-h-11 w-full justify-between px-0 text-left"
            data-testid="account-edit-open"
            isDisabled={!online}
            onPress={() => {
              if (!online) {
                setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
                return;
              }
              openEdit();
            }}
          >
            <span className="flex min-w-0 items-center gap-(--space-3)">
              <IconContainer tone={IconContainerTone.PRIMARY} size="sm">
                <AppIcon icon={ACTION_ICONS.edit} size={AppIconSize.SM} />
              </IconContainer>
              <span>{t("edit")}</span>
            </span>
            <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            className="min-h-11 w-full justify-between px-0 text-left text-danger"
            data-testid="account-archive-open"
            isDisabled={!online}
            onPress={() => {
              if (!online) {
                setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
                return;
              }
              setErrorCode(null);
              onModeChange(ACCOUNT_DETAIL_MODE.ARCHIVE);
            }}
          >
            <span className="flex min-w-0 items-center gap-(--space-3)">
              <IconContainer tone={IconContainerTone.DEBT} size="sm">
                <AppIcon icon={ACTION_ICONS.delete} size={AppIconSize.SM} />
              </IconContainer>
              <span>{t("archive")}</span>
            </span>
            <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
          </Button>
        </li>
        {errorCode ? (
          <li className="pt-(--space-3)">
            <StatusAlert
              variant="danger"
              title={t("edit")}
              description={t(`errors.${errorCode}`)}
            />
          </li>
        ) : null}
        {children ? <li>{children}</li> : null}
      </ul>
    </ActionSheetLayout.Body>
  );
}
