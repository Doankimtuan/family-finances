"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { DatePickerField, type DatePickerFieldProps } from "./date-time-field";
import { cn } from "@/shared/utils/cn";

export type DateInputProps = Omit<DatePickerFieldProps, "id"> & {
  id?: string;
  showShortcuts?: boolean;
  todayLabel?: string;
  yesterdayLabel?: string;
};

/**
 * Canonical ViNha DateInput primitive (Task 11 / Warm Precision).
 * Features 48px height, 10px radius, calendar popover, DD/MM/YYYY formatting,
 * and quick shortcuts (Hôm nay / Hôm qua) for high-speed logging.
 */
export function DateInput({
  id: idProp,
  value,
  onChange,
  showShortcuts = false,
  todayLabel,
  yesterdayLabel,
  isDisabled,
  className,
  ...props
}: DateInputProps) {
  const t = useTranslations("forms.dateShortcuts");
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const setToday = () => {
    if (isDisabled) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const setYesterday = () => {
    if (isDisabled) return;
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <DatePickerField
        id={id}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        {...props}
      />
      {showShortcuts && !isDisabled ? (
        <div className="flex gap-2 pl-1">
          <button
            type="button"
            onClick={setToday}
            className="inline-flex min-h-11 items-center rounded-full bg-surface-subtle px-3 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-subtle"
          >
            {todayLabel ?? t("today")}
          </button>
          <button
            type="button"
            onClick={setYesterday}
            className="inline-flex min-h-11 items-center rounded-full bg-surface-subtle px-3 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-subtle"
          >
            {yesterdayLabel ?? t("yesterday")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
