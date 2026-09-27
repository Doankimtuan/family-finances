"use client";

import {
  Input as HeroInput,
  type InputProps as HeroInputProps,
} from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type InputProps = HeroInputProps & {
  leadingIcon?: ReactNode;
  trailingElement?: ReactNode;
  isReadOnly?: boolean;
  hasError?: boolean;
};

export const FIELD_CHROME = cn(
  "h-12 min-h-12 w-full rounded-[var(--radius-control)] px-3.5",
  "border border-border-subtle bg-surface text-text-primary text-base md:text-sm",
  "shadow-xs transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "placeholder:text-text-muted",
  "hover:border-border-strong",
  "focus-visible:border-transparent focus-visible:shadow-none",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-surface-subtle disabled:hover:border-border-subtle",
  "read-only:bg-surface-subtle read-only:cursor-default read-only:hover:border-border-subtle",
  "motion-reduce:transition-none",
);

/**
 * Canonical ViNha Input primitive (Task 11 / Warm Precision).
 * Enforces 48px height, 10px radius, 16px mobile font, and distinct disabled vs read-only styling.
 */
export function Input({
  className,
  leadingIcon,
  trailingElement,
  isReadOnly = false,
  hasError = false,
  readOnly,
  disabled,
  ...props
}: InputProps) {
  const resolvedReadOnly = isReadOnly || readOnly;

  return (
    <div className="relative flex w-full items-center">
      {leadingIcon ? (
        <span className="pointer-events-none absolute left-3.5 flex items-center text-text-muted">
          {leadingIcon}
        </span>
      ) : null}
      <HeroInput
        readOnly={resolvedReadOnly}
        disabled={disabled}
        aria-readonly={resolvedReadOnly || undefined}
        aria-invalid={hasError || undefined}
        className={cn(
          FIELD_CHROME,
          leadingIcon && "pl-10",
          trailingElement && "pr-10",
          hasError && "border-debt focus-visible:border-transparent",
          className,
        )}
        {...props}
      />
      {trailingElement ? (
        <span className="absolute right-3.5 flex items-center text-text-muted">
          {trailingElement}
        </span>
      ) : null}
    </div>
  );
}
