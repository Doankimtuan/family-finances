"use client";

import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Input, type InputProps } from "@/shared/ui/input";
import { FormField, formFieldA11y } from "./form-field";
import { cn } from "@/shared/utils/cn";

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
  const a11y = formFieldA11y(id, hasError);

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
