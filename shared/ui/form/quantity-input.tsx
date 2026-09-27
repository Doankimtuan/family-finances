"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { FormField, formFieldA11y } from "./form-field";

export type QuantityInputProps = {
  id?: string;
  label?: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  maxValue?: number;
  unitSuffix?: string;
  maxLabel?: string;
  step?: number;
  decimals?: number;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha QuantityInput primitive (Task 11 / Warm Precision).
 * Engineered for investment holdings with embedded MAX button and unit suffixes.
 */
export function QuantityInput({
  id: idProp,
  label,
  value,
  onValueChange,
  maxValue,
  unitSuffix,
  maxLabel = "Tối đa",
  step = 1,
  decimals = 4,
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  disabled,
  readOnly,
  placeholder = "0",
  className,
  "data-testid": testId,
}: QuantityInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const effectiveDisabled = isDisabled || disabled;
  const effectiveReadOnly = isReadOnly || readOnly;
  const hasError = Boolean(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description), required);

  const displayValue = value != null ? String(value) : "";

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(",", ".");
    if (raw === "") {
      onValueChange(null);
      return;
    }
    const num = Number(raw);
    if (!Number.isNaN(num)) {
      const factor = 10 ** decimals;
      onValueChange(Math.round(num * factor) / factor);
    }
  };

  const handleMaxClick = () => {
    if (effectiveDisabled || effectiveReadOnly || maxValue == null) return;
    onValueChange(maxValue);
  };

  const control = (
    <div
      className={cn(
        "relative flex h-12 min-h-12 w-full items-center rounded-[var(--radius-control)] border px-3.5 bg-surface text-text-primary",
        "transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
        hasError
          ? "border-debt focus-within:border-debt focus-within:outline-debt"
          : "border-border-subtle hover:border-border-strong focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
        effectiveDisabled && "opacity-45 bg-surface-subtle cursor-not-allowed",
        effectiveReadOnly && "bg-surface-subtle cursor-default",
        className,
      )}
    >
      <input
        type="number"
        step={step}
        max={maxValue}
        min={0}
        placeholder={placeholder}
        value={displayValue}
        disabled={effectiveDisabled}
        readOnly={effectiveReadOnly}
        aria-readonly={effectiveReadOnly || undefined}
        onChange={handleInputChange}
        data-testid={testId}
        className="w-full bg-transparent text-base md:text-sm font-medium tracking-tight text-text-primary outline-none tabular-nums placeholder:text-text-muted"
        {...a11y}
      />

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {unitSuffix ? (
          <span className="text-sm font-medium text-text-secondary select-none">
            {unitSuffix}
          </span>
        ) : null}

        {maxValue != null && !effectiveDisabled && !effectiveReadOnly ? (
          <button
            type="button"
            onClick={handleMaxClick}
            className="inline-flex h-7 items-center rounded-md bg-primary-soft px-2 text-xs font-semibold text-primary hover:bg-primary-soft/80 active:scale-95"
            aria-label={`${maxLabel}: ${maxValue}`}
          >
            {maxLabel}
          </button>
        ) : null}
      </div>
    </div>
  );

  if (label) {
    return (
      <FormField
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
      >
        {control}
      </FormField>
    );
  }

  return control;
}
