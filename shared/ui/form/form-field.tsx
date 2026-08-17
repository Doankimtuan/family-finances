"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type FormFieldProps = {
  id: string;
  label: ReactNode;
  error?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Label + control + error/description with a11y wiring.
 * Pass the control as children (must use the same `id`).
 */
export function FormField({
  id,
  label,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className={cn("flex flex-col gap-(--space-2)", className)}>
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {description && !error ? (
        <Text id={descriptionId} tone="muted" size="sm">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text id={errorId} tone="danger" size="sm">
          {error}
        </Text>
      ) : null}
    </div>
  );
}

export function formFieldA11y(
  id: string,
  hasError: boolean,
  hasDescription = false,
) {
  const describedBy = [
    hasError ? `${id}-error` : null,
    // FormField hides the description while an error is shown.
    !hasError && hasDescription ? `${id}-description` : null,
  ]
    .filter((part) => part !== null)
    .join(" ");

  return {
    id,
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}
