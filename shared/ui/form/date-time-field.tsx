"use client";

import {
  Calendar,
  DateField as HeroDateField,
  DatePicker,
  TimeField as HeroTimeField,
} from "@heroui/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { parseDate, parseTime } from "@internationalized/date";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon } from "@/shared/ui/app-icon";
import { FormField } from "./form-field";

const fieldClassName = cn(
  "min-h-11 w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary",
  "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-focus-ring-soft)]",
);

export type DatePickerFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  minValue?: string;
  maxValue?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  "data-testid"?: string;
  className?: string;
};

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  onBlur,
  minValue,
  maxValue,
  description,
  error,
  required,
  isDisabled,
  "data-testid": testId,
  className,
}: DatePickerFieldProps) {
  const dateValue = value ? parseDate(value) : null;
  const minDateValue = minValue ? parseDate(minValue) : undefined;
  const maxDateValue = maxValue ? parseDate(maxValue) : undefined;

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <DatePicker
        value={dateValue}
        onChange={(next) => onChange(next ? next.toString() : "")}
        onBlur={onBlur}
        minValue={minDateValue}
        maxValue={maxDateValue}
        isDisabled={isDisabled}
        aria-required={required || undefined}
        aria-label={typeof label === "string" ? label : id}
        data-testid={testId}
        className="w-full"
      >
        <HeroDateField.Group
          fullWidth
          className={cn(
            fieldClassName,
            "flex w-full items-center px-(--space-2)",
          )}
        >
          <HeroDateField.Input className="min-w-0 flex-1 px-(--space-1)">
            {(segment) => <HeroDateField.Segment segment={segment} />}
          </HeroDateField.Input>
          <HeroDateField.Suffix>
            <DatePicker.Trigger className="ml-(--space-1) inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-text-secondary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus-ring">
              <AppIcon icon={Calendar03Icon} size="sm" />
            </DatePicker.Trigger>
          </HeroDateField.Suffix>
        </HeroDateField.Group>
        <DatePicker.Popover
          placement="bottom start"
          className={cn(
            "z-(--z-dropdown) rounded-[var(--radius-overlay)] border border-border-subtle",
            "bg-surface-elevated p-(--space-3) text-text-primary shadow-[var(--elevation-2)]",
          )}
        >
          <Calendar
            aria-label={typeof label === "string" ? label : id}
            className="text-text-primary"
          >
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    </FormField>
  );
}

export type TimeFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
};

export function TimeField({
  id,
  label,
  value,
  onChange,
  description,
  error,
  required,
  isDisabled,
}: TimeFieldProps) {
  const timeValue = value ? parseTime(value) : null;
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <HeroTimeField
        value={timeValue}
        onChange={(next) => onChange(next ? next.toString().slice(0, 5) : "")}
        isDisabled={isDisabled}
        aria-required={required || undefined}
        className="w-full"
        aria-label={typeof label === "string" ? label : id}
      >
        <HeroTimeField.Group className={cn(fieldClassName, "w-full")}>
          <HeroTimeField.Input>
            {(segment) => <HeroTimeField.Segment segment={segment} />}
          </HeroTimeField.Input>
        </HeroTimeField.Group>
      </HeroTimeField>
    </FormField>
  );
}
