"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  updateDebtFormSchema,
  type UpdateDebtFormValues,
} from "@/modules/ledger/application/commands/debt.schemas";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { DatePickerField, TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { updateDebtAction } from "../../money-products-actions";

type Props = {
  debtId: string;
  counterparty: string;
  dueDate: string | null;
  note: string | null;
  startDate: string;
  compactTrigger?: boolean;
};

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function DebtEditSheet({
  debtId,
  counterparty,
  dueDate,
  note,
  startDate,
  compactTrigger = false,
}: Props) {
  const t = useTranslations("money.debtDetail");
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
    reset,
    formState: { errors },
  } = useForm<UpdateDebtFormValues>({
    resolver: zodResolver(updateDebtFormSchema),
    defaultValues: {
      counterparty,
      dueDate,
      note: note ?? "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      reset({ counterparty, dueDate, note: note ?? "" });
      setErrorCode(null);
    }
    setIsOpen(next);
  }

  const submit = handleSubmit((values) => {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await updateDebtAction({
        debtId,
        counterparty: values.counterparty,
        dueDate: values.dueDate ?? null,
        note: values.note?.trim() || undefined,
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        setIsOpen(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  });

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      {compactTrigger ? (
        <IconButton
          aria-label={t("editDebt")}
          variant="secondary"
          data-testid="debt-edit-open"
          isDisabled={!online}
          onPress={() => handleOpenChange(true)}
        >
          <AppIcon icon={ACTION_ICONS.edit} size="sm" />
        </IconButton>
      ) : (
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          data-testid="debt-edit-open"
          isDisabled={!online}
          onPress={() => handleOpenChange(true)}
        >
          {t("editDebt")}
        </Button>
      )}
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{t("editDebt")}</Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
          <Text size="sm" tone="secondary">
            {t("editHint")}
          </Text>
          <TextField
            id="debt-edit-counterparty"
            label={t("editCounterparty")}
            registration={register("counterparty")}
            error={
              errors.counterparty
                ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                : undefined
            }
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field, fieldState }) => (
              <DatePickerField
                id="debt-edit-due-date"
                label={t("editDueDate")}
                value={field.value ?? ""}
                minValue={startDate || undefined}
                onChange={(value) => field.onChange(value || null)}
                onBlur={field.onBlur}
                error={
                  fieldState.error
                    ? tErrors(PRODUCT_ACTION_ERROR_CODE.INVALID)
                    : undefined
                }
              />
            )}
          />
          <TextField
            id="debt-edit-note"
            label={t("editNote")}
            registration={register("note")}
          />
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={isPending ? t("saving") : t("saveEdit")}
          primaryTestId="debt-edit-save"
          isDisabled={!online}
          isPending={isPending}
          onSecondary={() => handleOpenChange(false)}
          onPrimary={submit}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
