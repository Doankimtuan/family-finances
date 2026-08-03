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
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<RecurringDirectionValue>(
    RecurringDirection.EXPENSE,
  );
  const [amount, setAmount] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<RecurringFrequencyValue>(
    RecurringFrequency.MONTHLY,
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="recurring-create-open"
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
        setOpen(false);
        setName("");
        setAmount(null);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="recurring-create-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("add")}
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
        <legend className="text-sm font-semibold text-text-primary">
          {t("directionLabel")}
        </legend>
        <div className="flex gap-(--space-2)">
          {RECURRING_DIRECTION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              className={
                direction === d
                  ? "min-h-11 flex-1 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg"
                  : "min-h-11 flex-1 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary"
              }
              onClick={() => setDirection(d)}
            >
              {t(`direction.${d}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <AmountField
        id={amountId}
        label={t("amountLabel")}
        value={amount}
        onValueChange={setAmount}
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("frequencyLabel")}
        </legend>
        <div className="flex gap-(--space-2)">
          {RECURRING_FREQUENCY_VALUES.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={frequency === f}
              className={
                frequency === f
                  ? "min-h-11 flex-1 rounded-md bg-accent px-(--space-3) text-sm text-accent-fg"
                  : "min-h-11 flex-1 rounded-md border border-border-subtle px-(--space-3) text-sm text-text-primary"
              }
              onClick={() => setFrequency(f)}
            >
              {t(`frequency.${f}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        variant="primary"
        className="w-full"
        data-testid="recurring-create-submit"
        isDisabled={
          isPending ||
          !online ||
          name.trim().length < 2 ||
          amount == null ||
          amount <= 0
        }
        onPress={onSubmit}
      >
        {t("save")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => setOpen(false)}
      >
        {t("createCancel")}
      </Button>
    </div>
  );
}
