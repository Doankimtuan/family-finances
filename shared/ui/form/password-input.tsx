"use client";

import { useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ViewIcon, ViewOffIcon } from "@/shared/ui/stitch-icon-compat";
import { StitchLockIcon } from "@/shared/ui/stitch-icon-artwork";
import { AppIcon } from "@/shared/ui/app-icon";
import { Input, type InputProps } from "@/shared/ui/input";
import { FormField, formFieldA11y } from "./form-field";

export type PasswordInputProps = Omit<
  InputProps,
  "type" | "leadingIcon" | "trailingElement" | "id"
> & {
  id: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  registration?: UseFormRegisterReturn;
  showLeadingLock?: boolean;
  revealShowLabel?: string;
  revealHideLabel?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha PasswordInput primitive (Task 11 / Warm Precision).
 * Enforces 48px height, 10px radius, leading lock icon, accessible show/hide toggle,
 * and seamless FormField / React Hook Form integration.
 */
export function PasswordInput({
  id,
  label,
  description,
  error,
  required,
  registration,
  showLeadingLock = true,
  revealShowLabel = "Hiện mật khẩu",
  revealHideLabel = "Ẩn mật khẩu",
  className,
  isReadOnly = false,
  readOnly,
  disabled,
  "data-testid": testId,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  const hasError = Boolean(error);
  const resolvedReadOnly = isReadOnly || readOnly;
  const a11y = formFieldA11y(id, hasError, Boolean(description), required);

  const toggleReveal = () => {
    if (!disabled && !resolvedReadOnly) {
      setRevealed((prev) => !prev);
    }
  };

  const control = (
    <Input
      type={revealed ? "text" : "password"}
      autoComplete="current-password"
      disabled={disabled}
      isReadOnly={resolvedReadOnly}
      hasError={hasError}
      data-testid={testId}
      leadingIcon={
        showLeadingLock ? (
          <AppIcon
            icon={StitchLockIcon}
            size="md"
            className="text-text-muted"
          />
        ) : null
      }
      trailingElement={
        !resolvedReadOnly ? (
          <button
            type="button"
            onClick={toggleReveal}
            disabled={disabled}
            aria-label={revealed ? revealHideLabel : revealShowLabel}
            className="flex size-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <AppIcon icon={revealed ? ViewOffIcon : ViewIcon} size="md" />
          </button>
        ) : null
      }
      className={className}
      {...a11y}
      {...registration}
      {...props}
    />
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
