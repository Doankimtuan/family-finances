"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  DebtCreationMode,
  DebtDirection,
  DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  createDebtIdempotencyKey,
} from "@/modules/ledger/application/ledger-constants";
import {
  createDebtFormSchema,
  type CreateDebtFormValues,
} from "@/modules/ledger/application/commands/debt.schemas";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AmountField } from "@/shared/patterns/amount-field";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { DatePickerField, SelectField } from "@/shared/ui/form";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { createDebtAction } from "../money-products-actions";

type AccountOption = { id: string; name: string };
type DebtCreateSheetProps = { accounts: AccountOption[]; today: string };
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function DebtCreateSheet({ accounts, today }: DebtCreateSheetProps) {
  const t = useTranslations("money.debtsPage");
  const tErrors = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    formState: { errors },
  } = useForm<CreateDebtFormValues>({
    resolver: zodResolver(createDebtFormSchema),
    defaultValues: {
      counterparty: "",
      direction: DebtDirection.BORROWED,
      creationMode: DebtCreationMode.EXISTING_BALANCE,
      principalAmount: undefined,
      startDate: today,
      dueDate: null,
      note: "",
      accountId: null,
    },
  });
  const direction = useWatch({ control, name: "direction" });
  const creationMode = useWatch({ control, name: "creationMode" });
  const startDate = useWatch({ control, name: "startDate" });
  const moneyMovesNow = creationMode === DebtCreationMode.MONEY_MOVED;

  function reset() {
    resetForm({
      counterparty: "",
      direction: DebtDirection.BORROWED,
      creationMode: DebtCreationMode.EXISTING_BALANCE,
      principalAmount: undefined,
      startDate: today,
      dueDate: null,
      note: "",
      accountId: null,
    });
    setErrorCode(null);
  }

  function handleOpenChange(next: boolean) {
    reset();
    setIsOpen(next);
  }

  function chooseDirection(next: DebtDirection) {
    setValue("direction", next);
    setValue("accountId", null);
    setErrorCode(null);
  }

  function chooseCreationMode(next: DebtCreationMode) {
    setValue("creationMode", next);
    if (next === DebtCreationMode.EXISTING_BALANCE) setValue("accountId", null);
    setErrorCode(null);
  }

  const submit = handleSubmit((values) => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await createDebtAction({
        name: values.counterparty,
        counterparty: values.counterparty,
        direction: values.direction,
        creationMode: values.creationMode,
        principalAmount: values.principalAmount,
        startDate: values.startDate,
        dueDate: values.dueDate,
        note: values.note?.trim() || undefined,
        accountId: moneyMovesNow ? values.accountId : null,
        idempotencyKey: createDebtIdempotencyKey(
          DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
        ),
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        reset();
        setIsOpen(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  });

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-create-open"
        isDisabled={!online}
        onPress={() => handleOpenChange(true)}
      >
        {t("add")}
      </Button>
      <SheetContent>
        <Sheet.Header>
          <Sheet.Heading>{t("create.title")}</Sheet.Heading>
        </Sheet.Header>
        <Sheet.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
          <FormGroupLabel>{t("create.relationship")}</FormGroupLabel>
          <ChoiceTileGroup
            hint={
              direction === DebtDirection.BORROWED
                ? t("create.borrowedDescription")
                : t("create.lentDescription")
            }
          >
            <ChoiceTile
              label={t("create.borrowed")}
              icon={
                <IconContainer
                  tone={
                    direction === DebtDirection.BORROWED ? "primary" : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                </IconContainer>
              }
              selected={direction === DebtDirection.BORROWED}
              onPress={() => chooseDirection(DebtDirection.BORROWED)}
            />
            <ChoiceTile
              label={t("create.lent")}
              icon={
                <IconContainer
                  tone={
                    direction === DebtDirection.LENT ? "primary" : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.income} size="sm" />
                </IconContainer>
              }
              selected={direction === DebtDirection.LENT}
              onPress={() => chooseDirection(DebtDirection.LENT)}
            />
          </ChoiceTileGroup>
          <FormGroupLabel>{t("create.whoAndAmount")}</FormGroupLabel>
          <TextField
            id="debt-counterparty"
            label={
              direction === DebtDirection.BORROWED
                ? t("create.borrowedCounterparty")
                : t("create.lentCounterparty")
            }
            registration={register("counterparty")}
            error={
              errors.counterparty
                ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                : undefined
            }
          />
          <Controller
            control={control}
            name="principalAmount"
            render={({ field, fieldState }) => (
              <AmountField
                id="debt-principal"
                label={t("create.principal")}
                value={field.value ?? null}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                required
                error={
                  fieldState.error
                    ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                    : undefined
                }
              />
            )}
          />
          <FormGroupLabel>{t("create.recordingMode")}</FormGroupLabel>
          <ChoiceTileGroup
            hint={
              creationMode === DebtCreationMode.EXISTING_BALANCE
                ? t("create.existingDescription")
                : t("create.moneyMovedDescription")
            }
          >
            <ChoiceTile
              label={t("create.existing")}
              icon={
                <IconContainer
                  tone={
                    creationMode === DebtCreationMode.EXISTING_BALANCE
                      ? "primary"
                      : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                </IconContainer>
              }
              selected={creationMode === DebtCreationMode.EXISTING_BALANCE}
              onPress={() =>
                chooseCreationMode(DebtCreationMode.EXISTING_BALANCE)
              }
            />
            <ChoiceTile
              label={t("create.moneyMoved")}
              icon={
                <IconContainer
                  tone={
                    creationMode === DebtCreationMode.MONEY_MOVED
                      ? "primary"
                      : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.transfer} size="sm" />
                </IconContainer>
              }
              selected={creationMode === DebtCreationMode.MONEY_MOVED}
              onPress={() => chooseCreationMode(DebtCreationMode.MONEY_MOVED)}
            />
          </ChoiceTileGroup>
          {moneyMovesNow ? (
            <Controller
              control={control}
              name="accountId"
              render={({ field, fieldState }) => (
                <SelectField
                  id="debt-account"
                  label={
                    direction === DebtDirection.BORROWED
                      ? t("create.receiveInto")
                      : t("create.lendFrom")
                  }
                  description={
                    direction === DebtDirection.BORROWED
                      ? t("create.receiveIntoDescription")
                      : t("create.lendFromDescription")
                  }
                  value={field.value ?? ""}
                  onChange={(next) => field.onChange(next || null)}
                  onBlur={field.onBlur}
                  options={accounts.map((account) => ({
                    id: account.id,
                    label: account.name,
                  }))}
                  error={
                    fieldState.error
                      ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                      : undefined
                  }
                />
              )}
            />
          ) : null}
          <FormGroupLabel>{t("create.timing")}</FormGroupLabel>
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <DatePickerField
                id="debt-start-date"
                label={t("create.startDate")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                required
                error={
                  fieldState.error
                    ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                    : undefined
                }
                data-testid="debt-start-date"
              />
            )}
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field, fieldState }) => (
              <DatePickerField
                id="debt-due-date"
                label={t("create.dueDate")}
                value={field.value ?? ""}
                onChange={(next) => field.onChange(next || null)}
                onBlur={field.onBlur}
                minValue={startDate || undefined}
                error={
                  fieldState.error
                    ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                    : undefined
                }
                data-testid="debt-due-date"
              />
            )}
          />
          <FormGroupLabel>{t("create.optionalDetails")}</FormGroupLabel>

          <TextField
            id="debt-note"
            label={t("create.note")}
            registration={register("note")}
          />
        </Sheet.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={isPending ? t("saving") : t("create.save")}
          primaryTestId="debt-create-submit"
          isDisabled={!online}
          isPending={isPending}
          onSecondary={() => handleOpenChange(false)}
          onPrimary={submit}
        />
      </SheetContent>
    </Sheet>
  );
}

function FormGroupLabel({ children }: { children: string }) {
  return (
    <Text size="sm" weight="medium" className="text-text-primary">
      {children}
    </Text>
  );
}
