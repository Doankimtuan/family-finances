"use client";

import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Input, type InputProps } from "@/shared/ui/input";
import { FormField, formFieldA11y } from "./form-field";
import { cn } from "@/shared/utils/cn";
import { DatePickerField, TimeField } from "./date-time-field";
import { NumberField as NumericField } from "./number-field";

export type TextFieldProps = Omit<
  InputProps,
  "id" | "aria-invalid" | "aria-describedby"
> & {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
  error?: FieldError | string;
  registration?: UseFormRegisterReturn;
  fieldClassName?: string;
};

function resolveErrorMessage(error?: FieldError | string): ReactNode {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  return error.message;
}

/**
 * FormField + Input with RHF `registration` and default touch target.
 */
export function TextField({
  id,
  label,
  description,
  required,
  error,
  registration,
  fieldClassName,
  className,
  ...inputProps
}: TextFieldProps) {
  const hasError = Boolean(error);
  const errorMessage = resolveErrorMessage(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description), required);

  if (inputProps.type === "date" || inputProps.type === "time") {
    const value = typeof inputProps.value === "string" ? inputProps.value : "";
    const handleValueChange = (next: string) => {
      const event = {
        target: { value: next },
      } as React.ChangeEvent<HTMLInputElement>;
      inputProps.onChange?.(event);
      registration?.onChange?.(event);
    };
    const fieldProps = {
      id,
      label,
      value,
      onChange: handleValueChange,
      description,
      error: errorMessage,
      required,
      isDisabled: inputProps.disabled,
    };
    return inputProps.type === "date" ? (
      <DatePickerField {...fieldProps} />
    ) : (
      <TimeField {...fieldProps} />
    );
  }

  if (inputProps.type === "number") {
    const rawValue = inputProps.value;
    const numericValue =
      rawValue === "" || rawValue == null ? undefined : Number(rawValue);
    const handleNumericChange = (next: number) => {
      const event = {
        target: { value: String(next) },
      } as React.ChangeEvent<HTMLInputElement>;
      inputProps.onChange?.(event);
      registration?.onChange?.(event);
    };
    return (
      <NumericField
        id={id}
        label={label}
        value={Number.isFinite(numericValue) ? numericValue : undefined}
        onChange={handleNumericChange}
        minValue={
          typeof inputProps.min === "number" ? inputProps.min : undefined
        }
        maxValue={
          typeof inputProps.max === "number" ? inputProps.max : undefined
        }
        step={typeof inputProps.step === "number" ? inputProps.step : undefined}
        isDisabled={inputProps.disabled}
        description={description}
        error={errorMessage}
        required={required}
        data-testid={(inputProps as { "data-testid"?: string })["data-testid"]}
      />
    );
  }

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      required={required}
      error={errorMessage}
      className={fieldClassName}
    >
      <Input
        {...inputProps}
        {...registration}
        {...a11y}
        className={cn("min-h-11", className)}
      />
    </FormField>
  );
}
