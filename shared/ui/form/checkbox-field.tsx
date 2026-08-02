"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> & {
  label: ReactNode;
  error?: ReactNode;
};

/** Lightweight checkbox for auth agreements / remember-me. */
export function CheckboxField({
  id,
  label,
  error,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-(--space-3) text-sm leading-snug text-text-secondary"
      >
        <input
          id={id}
          type="checkbox"
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded-[var(--radius-sm)]",
            "border border-border-strong bg-surface accent-[var(--color-accent)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="ps-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
