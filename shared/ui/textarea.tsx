"use client";

import {
  TextArea as HeroTextArea,
  type TextAreaProps as HeroTextAreaProps,
} from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type TextareaProps = HeroTextAreaProps & {
  maxLength?: number;
  currentLength?: number;
  showCounter?: boolean;
  hasError?: boolean;
  isReadOnly?: boolean;
  helperText?: ReactNode;
};

const TEXTAREA_CHROME = cn(
  "min-h-21 w-full rounded-[var(--radius-control)] p-3 text-base md:text-sm",
  "border border-border-subtle bg-surface text-text-primary",
  "shadow-xs transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "placeholder:text-text-muted",
  "hover:border-border-strong",
  "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-surface-subtle disabled:hover:border-border-subtle",
  "read-only:bg-surface-subtle read-only:cursor-default read-only:hover:border-border-subtle",
  "motion-reduce:transition-none",
);

/**
 * Canonical ViNha Textarea primitive (Task 11 / Warm Precision).
 * Enforces 84px min-height, 10px radius, character counter, and distinct states.
 */
export function Textarea({
  className,
  maxLength,
  currentLength,
  showCounter = false,
  hasError = false,
  isReadOnly = false,
  readOnly,
  disabled,
  value,
  ...props
}: TextareaProps) {
  const resolvedReadOnly = isReadOnly || readOnly;
  const count = currentLength ?? (typeof value === "string" ? value.length : 0);

  return (
    <div className="flex flex-col gap-1 w-full">
      <HeroTextArea
        readOnly={resolvedReadOnly}
        disabled={disabled}
        maxLength={maxLength}
        aria-readonly={resolvedReadOnly || undefined}
        aria-invalid={hasError || undefined}
        value={value}
        className={cn(
          TEXTAREA_CHROME,
          hasError &&
            "border-debt focus-visible:border-debt focus-visible:outline-debt",
          className,
        )}
        {...props}
      />
      {showCounter && maxLength ? (
        <div className="flex justify-end text-label-sm text-text-muted">
          <span>
            {count} / {maxLength} ký tự
          </span>
        </div>
      ) : null}
    </div>
  );
}
