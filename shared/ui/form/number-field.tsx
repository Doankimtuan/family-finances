"use client";

import { NumberField as HeroNumberField } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { FormField } from "./form-field";

export type NumberFieldProps = {
  id: string;
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  name?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  placeholder?: string;
  suffix?: ReactNode;
  trailingAction?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/** HeroUI NumberField with the shared label, validation, and focus contract. */
export function NumberField({
  id,
  label,
  value,
  defaultValue,
  onChange,
  onBlur,
  minValue,
  maxValue,
  step,
  formatOptions,
  name,
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  placeholder,
  suffix,
  trailingAction,
  className,
  "data-testid": testId,
}: NumberFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <HeroNumberField
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        formatOptions={formatOptions}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        aria-required={required || undefined}
        aria-label={typeof label === "string" ? label : id}
        data-testid={testId}
        fullWidth
        className="w-full"
      >
        <HeroNumberField.Group
          className={cn(
            "min-h-11 flex w-full min-w-0 items-center border border-border-subtle rounded-[var(--radius-control)] bg-surface text-text-primary",
            "focus-within:border-transparent focus-within:shadow-none",
            "transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
            className,
          )}
        >
          <HeroNumberField.Input
            placeholder={placeholder}
            className="min-h-11 min-w-0 flex-1 px-(--space-3) text-sm tabular-nums outline-none"
          />
          {suffix ? (
            <span className="shrink-0 px-(--space-1) text-sm text-text-secondary">
              {suffix}
            </span>
          ) : null}
          {trailingAction}
        </HeroNumberField.Group>
      </HeroNumberField>
    </FormField>
  );
}
