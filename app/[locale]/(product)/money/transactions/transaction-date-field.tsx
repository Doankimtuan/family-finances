"use client";

import { useTranslations } from "next-intl";
import {
  DatePickerField,
  type DatePickerFieldProps,
} from "@/shared/ui/form/date-time-field";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { MILLISECONDS_PER_DAY, todayIsoDate } from "@/shared/utils/iso-date";

export function TransactionDateField(props: DatePickerFieldProps) {
  const t = useTranslations("money.captureForm");
  const today = todayIsoDate();
  const yesterday = todayIsoDate(
    new Date(Date.parse(`${today}T00:00:00Z`) - MILLISECONDS_PER_DAY),
  );
  return (
    <div className="flex flex-col gap-(--space-2)">
      <DatePickerField {...props} />
      <div
        role="group"
        aria-label={typeof props.label === "string" ? props.label : props.id}
        className="inline-flex self-start gap-(--space-2)"
      >
        <Button
          type="button"
          variant={
            props.value === today ? ButtonVariant.TONAL : ButtonVariant.OUTLINED
          }
          className="gap-(--space-2) px-(--space-3)"
          isDisabled={
            props.isDisabled ||
            Boolean(props.minValue && today < props.minValue) ||
            Boolean(props.maxValue && today > props.maxValue)
          }
          aria-pressed={props.value === today}
          onPress={() => props.onChange(today)}
        >
          <AppIcon
            icon={ACTION_ICONS.check}
            size="sm"
            className={props.value === today ? "opacity-100" : "opacity-0"}
          />
          {t("today")}
        </Button>
        <Button
          type="button"
          variant={
            props.value === yesterday
              ? ButtonVariant.TONAL
              : ButtonVariant.OUTLINED
          }
          className="gap-(--space-2) px-(--space-3)"
          isDisabled={
            props.isDisabled ||
            Boolean(props.minValue && yesterday < props.minValue) ||
            Boolean(props.maxValue && yesterday > props.maxValue)
          }
          aria-pressed={props.value === yesterday}
          onPress={() => props.onChange(yesterday)}
        >
          <AppIcon
            icon={ACTION_ICONS.check}
            size="sm"
            className={props.value === yesterday ? "opacity-100" : "opacity-0"}
          />
          {t("yesterday")}
        </Button>
      </div>
    </div>
  );
}
