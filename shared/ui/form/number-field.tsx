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
        aria-label={typeof label === "string" ? label : id}
        data-testid={testId}
        className="w-full"
      >
        <HeroNumberField.Group
          className={cn(
            "min-h-11 w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface text-text-primary",
            "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-focus-ring-soft)]",
            "transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
            className,
          )}
        >
          <HeroNumberField.Input className="min-h-11 w-full px-(--space-3) text-sm tabular-nums outline-none" />
        </HeroNumberField.Group>
      </HeroNumberField>
    </FormField>
  );
}
