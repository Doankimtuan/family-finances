"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type FormFieldProps = {
  id: string;
  label: ReactNode;
  error?: ReactNode;
  description?: ReactNode;
  labelAccessory?: ReactNode;
  labelClassName?: string;
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
  labelAccessory,
  labelClassName,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className={cn("flex flex-col gap-(--space-2)", className)}>
      <div
        className={cn(
          labelAccessory && "flex items-center justify-between gap-(--space-2)",
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-text-primary",
            labelClassName,
          )}
        >
          {label}
          {required ? (
            <span className="text-danger" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
        {labelAccessory ? (
          <div className="shrink-0">{labelAccessory}</div>
        ) : null}
      </div>
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
  required = false,
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
    ...(required ? { "aria-required": true as const } : {}),
  } as const;
}
