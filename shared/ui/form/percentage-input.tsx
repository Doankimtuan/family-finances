"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { FormField, formFieldA11y } from "./form-field";

export type PercentageInputProps = {
  id?: string;
  label?: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
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
 * Canonical ViNha PercentageInput primitive (Task 11 / Warm Precision).
 * Formats interest rates and yields with explicit compounding period suffixes (e.g. `% / năm`).
 */
export function PercentageInput({
  id: idProp,
  label,
  value,
  onValueChange,
  suffix = "% / năm",
  min = 0,
  max = 100,
  step = 0.1,
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  disabled,
  readOnly,
  placeholder = "0,0",
  className,
  "data-testid": testId,
}: PercentageInputProps) {
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
      onValueChange(num);
    }
  };

  const isHighRateWarning =
    value != null && value > 30 && suffix.includes("năm");

  const control = (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={cn(
          "relative flex h-12 min-h-12 w-full items-center rounded-[var(--radius-control)] border px-3.5 bg-surface text-text-primary",
          "transition-[border-color,box-shadow,background-color] duration-(--duration-fast)",
          hasError
            ? "border-debt focus-within:border-debt focus-within:outline-debt"
            : isHighRateWarning
              ? "border-warning focus-within:border-warning"
              : "border-border-subtle hover:border-border-strong focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
          effectiveDisabled &&
            "opacity-45 bg-surface-subtle cursor-not-allowed",
          effectiveReadOnly && "bg-surface-subtle cursor-default",
          className,
        )}
      >
        <input
          type="number"
          step={step}
          min={min}
          max={max}
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
        <span className="text-sm font-medium text-text-secondary select-none shrink-0 ml-2">
          {suffix}
        </span>
      </div>

      {isHighRateWarning && !error ? (
        <span className="text-label-sm text-warning pl-1">
          Lưu ý: Lãi suất trên 30%/năm là mức rất cao.
        </span>
      ) : null}
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
