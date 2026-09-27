"use client";

import { useId, type ReactNode } from "react";
import { NumberField } from "./number-field";

export type NumberInputProps = {
  id?: string;
  label: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  suffix?: ReactNode;
  trailingAction?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
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

/** Numeric input composed from the shared HeroUI NumberField. */
export function NumberInput({
  id: idProp,
  label,
  value,
  onValueChange,
  suffix,
  trailingAction,
  min = 0,
  max,
  step = 1,
  formatOptions,
  description,
  error,
  required,
  isDisabled,
  isReadOnly,
  disabled,
  readOnly,
  placeholder,
  className,
  "data-testid": testId,
}: NumberInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <NumberField
      id={id}
      label={label}
      value={value === null ? Number.NaN : value}
      onChange={(next) => onValueChange(Number.isFinite(next) ? next : null)}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={formatOptions}
      description={description}
      error={error}
      required={required}
      isDisabled={isDisabled || disabled}
      isReadOnly={isReadOnly || readOnly}
      placeholder={placeholder}
      suffix={suffix}
      trailingAction={trailingAction}
      className={className}
      data-testid={testId}
    />
  );
}
