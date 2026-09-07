"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  RecurringDirection,
  RecurringFrequency,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
  type RecurringDirection as RecurringDirectionValue,
  type RecurringFrequency as RecurringFrequencyValue,
} from "@/modules/plan/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createRecurringAction } from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateRecurringForm() {
  const t = useTranslations("plan.recurring");
  const router = useRouter();
  const nameId = useId();
  const amountId = useId();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<RecurringDirectionValue>(
    RecurringDirection.EXPENSE,
  );
  const [amount, setAmount] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<RecurringFrequencyValue>(
    RecurringFrequency.MONTHLY,
  );
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setAmount(null);
    setDirection(RecurringDirection.EXPENSE);
    setFrequency(RecurringFrequency.MONTHLY);
  };

  const close = () => {
    statusAlert.hide();
    reset();
    setOpen(false);
  };

  const showCreateError = (code: ErrorCode) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t("add"),
      description: t(`errors.${code}`),
    });
  };

  const onSubmit = () => {
    statusAlert.hide();
    if (!online) {
      showCreateError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (amount == null || amount <= 0) {
      return;
    }
    const start = todayIso();
    startTransition(async () => {
      const result = await createRecurringAction({
        name: name.trim(),
        direction,
        amount,
        frequency,
        intervalCount: 1,
        dayOfMonth:
          frequency === RecurringFrequency.MONTHLY
            ? new Date().getUTCDate()
            : null,
        dayOfWeek:
          frequency === RecurringFrequency.WEEKLY
            ? new Date().getUTCDay()
            : null,
        startDate: start,
        nextRunDate: start,
        isActive: true,
      });
      if (result.status === "success") {
        close();
        router.refresh();
        return;
      }
      showCreateError(result.code);
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        data-testid="recurring-create-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) return;
          statusAlert.hide();
          setOpen(true);
        }}
      >
        {online ? t("add") : t("errors.offline")}
      </Button>
      <Sheet isOpen={open} onOpenChange={(next) => !next && close()}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("add")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            {open ? (
              <div
                className="flex flex-col gap-(--space-3)"
                data-testid="recurring-create-form"
              >
                <TextField
                  id={nameId}
                  label={t("nameLabel")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <fieldset className="flex flex-col gap-(--space-2)">
                  <legend className="text-sm font-medium text-text-primary">
                    {t("directionLabel")}
                  </legend>
                  <ChoiceTileGroup>
                    {RECURRING_DIRECTION_OPTIONS.map((option) => (
                      <ChoiceTile
                        key={option}
                        label={t(`direction.${option}`)}
                        selected={direction === option}
                        onPress={() => setDirection(option)}
                        role="radio"
                      />
                    ))}
                  </ChoiceTileGroup>
                </fieldset>
                <AmountField
                  id={amountId}
                  label={t("amountLabel")}
                  value={amount}
                  onValueChange={setAmount}
                />
                <fieldset className="flex flex-col gap-(--space-2)">
                  <legend className="text-sm font-medium text-text-primary">
                    {t("frequencyLabel")}
                  </legend>
                  <ChoiceTileGroup>
                    {RECURRING_FREQUENCY_VALUES.map((option) => (
                      <ChoiceTile
                        key={option}
                        label={t(`frequency.${option}`)}
                        selected={frequency === option}
                        onPress={() => setFrequency(option)}
                        role="radio"
                      />
                    ))}
                  </ChoiceTileGroup>
                </fieldset>
              </div>
            ) : null}
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={t("save")}
            onSecondary={close}
            onPrimary={onSubmit}
            primaryTestId="recurring-create-submit"
            isDisabled={!online}
            isPrimaryDisabled={
              name.trim().length < 2 || amount == null || amount <= 0
            }
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
