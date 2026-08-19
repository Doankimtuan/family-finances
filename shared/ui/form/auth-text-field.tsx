"use client";

import { useState, type ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { ViewOffIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { AppIcon } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";
import { FormField, formFieldA11y } from "./form-field";

export type AuthTextFieldProps = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
  error?: FieldError | string;
  registration?: UseFormRegisterReturn;
  fieldClassName?: string;
  className?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  startIcon?: ReactNode;
  /** Enables password visibility toggle when type is password. */
  revealable?: boolean;
  /** Localized labels required when the password reveal button is shown. */
  revealShowLabel?: string;
  revealHideLabel?: string;
};

function resolveErrorMessage(error?: FieldError | string): ReactNode {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  return error.message;
}

/**
 * Auth-oriented field: 56px height, leading icon, optional password reveal.
 */
export function AuthTextField({
  id,
  label,
  description,
  required,
  error,
  registration,
  fieldClassName,
  className,
  type = "text",
  autoComplete,
  placeholder,
  startIcon,
  revealable = false,
  revealShowLabel,
  revealHideLabel,
}: AuthTextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error);
  const errorMessage = resolveErrorMessage(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description));
  const isPassword = type === "password" || revealable;
  const canReveal = isPassword && Boolean(revealShowLabel && revealHideLabel);
  const inputType = canReveal && revealed ? "text" : type;

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      required={required}
      error={errorMessage}
      className={fieldClassName}
    >
      <div className="relative">
        {startIcon ? (
          <span
            className="pointer-events-none absolute start-3.5 top-1/2 z-10 -translate-y-1/2 text-text-muted"
            aria-hidden
          >
            {startIcon}
          </span>
        ) : null}
        <input
          {...registration}
          {...a11y}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(
            "min-h-14 w-full rounded-lg",
            "border border-border-strong bg-surface text-text-primary",
            "px-(--space-4) text-base leading-normal",
            "placeholder:text-text-muted",
            "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
            "focus-visible:border-accent focus-visible:outline-none",
            "focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
            "motion-reduce:transition-none",
            startIcon && "ps-11",
            canReveal && "pe-12",
            hasError && "border-danger",
            className,
          )}
        />
        {canReveal ? (
          <button
            type="button"
            tabIndex={-1}
            className={cn(
              "absolute end-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center",
              "rounded-md text-text-muted",
              "hover:text-text-secondary",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            )}
            aria-label={revealed ? revealHideLabel : revealShowLabel}
            onClick={() => setRevealed((v) => !v)}
          >
            <AppIcon icon={revealed ? ViewOffIcon : ViewIcon} size="sm" />
          </button>
        ) : null}
      </div>
    </FormField>
  );
}
