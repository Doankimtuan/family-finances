"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  RecurringFrequency,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
  type RecurringDirection as RecurringDirectionValue,
  type RecurringFrequency as RecurringFrequencyValue,
} from "@/modules/plan/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { updateRecurringAction, deleteRecurringAction } from "../actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  ruleId: string;
  name: string;
  direction: RecurringDirectionValue;
  amount: number;
  frequency: RecurringFrequencyValue;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  nextRunDate: string | null;
  isActive: boolean;
};

export function RecurringDetailForm({
  ruleId,
  name: initialName,
  direction: initialDirection,
  amount: initialAmount,
  frequency: initialFrequency,
  dayOfMonth: initialDom,
  dayOfWeek: initialDow,
  startDate: initialStart,
  nextRunDate: initialNext,
  isActive: initialActive,
}: Props) {
  const t = useTranslations("plan.recurring");
  const router = useRouter();
  const nameId = useId();
  const amountId = useId();
  const startId = useId();
  const nextId = useId();
  const domId = useId();
  const dowId = useId();
  const { online } = useOnlineStatusClient();
  const [name, setName] = useState(initialName);
  const [direction, setDirection] =
    useState<RecurringDirectionValue>(initialDirection);
  const [amount, setAmount] = useState<number | null>(initialAmount);
  const [frequency, setFrequency] =
    useState<RecurringFrequencyValue>(initialFrequency);
  const [dayOfMonth, setDayOfMonth] = useState(
    String(initialDom ?? new Date().getUTCDate()),
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    String(initialDow ?? new Date().getUTCDay()),
  );
  const [startDate, setStartDate] = useState(initialStart);
  const [nextRunDate, setNextRunDate] = useState(initialNext ?? initialStart);
  const [isActive, setIsActive] = useState(initialActive);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (amount == null || amount <= 0) {
      return;
    }
    startTransition(async () => {
      const result = await updateRecurringAction({
        ruleId,
        name: name.trim(),
        direction,
        amount,
        frequency,
        intervalCount: 1,
        dayOfMonth:
          frequency === RecurringFrequency.MONTHLY ? Number(dayOfMonth) : null,
        dayOfWeek:
          frequency === RecurringFrequency.WEEKLY ? Number(dayOfWeek) : null,
        startDate,
        nextRunDate: nextRunDate || startDate,
        isActive,
      });
      if (result.status === "success") {
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  const onDelete = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await deleteRecurringAction({ ruleId });
      if (result.status === "success") {
        router.replace(APP_PATH.PLAN_RECURRING);
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="recurring-detail-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("save")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

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

      {frequency === RecurringFrequency.MONTHLY ? (
        <TextField
          id={domId}
          label={t("dayOfMonthLabel")}
          inputMode="numeric"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
        />
      ) : (
        <TextField
          id={dowId}
          label={t("dayOfWeekLabel")}
          inputMode="numeric"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
        />
      )}

      <TextField
        id={startId}
        label={t("startDateLabel")}
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <TextField
        id={nextId}
        label={t("nextRunLabel")}
        type="date"
        value={nextRunDate}
        onChange={(e) => setNextRunDate(e.target.value)}
      />

      <Card tone="soft" className="gap-0 p-(--space-4)">
        <label className="flex min-h-11 items-center gap-(--space-3)">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-[var(--color-accent)]"
          />
          <Text size="sm">{t("activeLabel")}</Text>
        </label>
      </Card>

      <Button
        variant="primary"
        className="w-full"
        data-testid="recurring-save"
        isDisabled={isPending || !online}
        onPress={onSave}
      >
        {t("save")}
      </Button>
      <Button
        variant="danger"
        className="w-full"
        data-testid="recurring-delete"
        isDisabled={isPending || !online}
        onPress={() => setConfirmDelete(true)}
      >
        {t("delete")}
      </Button>

      <Sheet isOpen={confirmDelete} onOpenChange={setConfirmDelete}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("deleteConfirmTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <StatusAlert
              variant="danger"
              title={t("deleteConfirmTitle")}
              description={t("deleteConfirmBody")}
              data-testid="recurring-delete-confirm"
            />
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={t("deleteConfirmYes")}
            onSecondary={() => setConfirmDelete(false)}
            onPrimary={onDelete}
            primaryTestId="recurring-delete-confirm-yes"
            isDisabled={!online}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
