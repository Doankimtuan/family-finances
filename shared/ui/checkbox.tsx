"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Tick01Icon } from "@/shared/ui/stitch-icon-compat";
import { AppIcon } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";

export type CheckboxProps = {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  "aria-label"?: string;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

export type CheckboxGroupProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  orientation?: "vertical" | "horizontal";
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function CheckboxGroup({
  label,
  description,
  error,
  orientation = "vertical",
  children,
  className,
  "data-testid": testId,
}: CheckboxGroupProps) {
  return (
    <fieldset
      data-testid={testId}
      className={cn("flex flex-col gap-2 border-none p-0 m-0", className)}
    >
      {label ? (
        <legend className="text-sm font-semibold text-text-primary mb-1">
          {label}
        </legend>
      ) : null}
      {description ? (
        <p className="text-xs text-text-muted mb-2">{description}</p>
      ) : null}
      <div
        className={cn(
          orientation === "horizontal"
            ? "flex flex-row flex-wrap items-center gap-4"
            : "flex flex-col gap-0",
        )}
      >
        {children}
      </div>
      {error ? (
        <p className="text-xs text-debt font-medium mt-1" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Canonical ViNha Checkbox primitive (Task 11 / Warm Precision).
 * Enforces 20x20px box, 4px radius, primary teal fill, 44x44px touch target,
 * and distinct unchecked, checked, indeterminate, and disabled states.
 */
export function Checkbox({
  id: idProp,
  checked,
  defaultChecked,
  indeterminate = false,
  onChange,
  label,
  "aria-label": ariaLabel,
  description,
  error,
  disabled = false,
  className,
  "data-testid": testId,
}: CheckboxProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const isControlled = checked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    defaultChecked ?? false,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) {
      setUncontrolledChecked(e.target.checked);
    }
    onChange?.(e.target.checked);
  };

  const resolvedChecked = isControlled ? checked : uncontrolledChecked;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={id}
        className={cn(
          "group relative flex min-h-11 cursor-pointer items-center gap-3 select-none",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        <div className="relative flex size-5 shrink-0 items-center justify-center">
          <input
            id={id}
            ref={inputRef}
            type="checkbox"
            checked={resolvedChecked}
            disabled={disabled}
            aria-label={!label ? ariaLabel : undefined}
            aria-checked={indeterminate ? "mixed" : resolvedChecked}
            onChange={handleChange}
            data-testid={testId}
            className="peer sr-only"
          />
          {/* Custom Visual Box */}
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-[var(--radius-xs)] border transition-[background-color,border-color,box-shadow]",
              "border-border-strong bg-surface text-primary-fg",
              "group-hover:border-primary",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
              (resolvedChecked || indeterminate) &&
                "border-primary bg-primary text-primary-fg",
              disabled &&
                "peer-checked:bg-primary/50 peer-checked:border-transparent",
            )}
          >
            {indeterminate ? (
              <span className="block h-0.5 w-2.5 bg-current rounded-full" />
            ) : resolvedChecked ? (
              <AppIcon icon={Tick01Icon} size="xs" className="stroke-[2.5]" />
            ) : null}
          </div>
        </div>

        {label ? (
          <div className="flex flex-col text-sm leading-tight">
            <span className="font-medium text-text-primary group-hover:text-primary transition-colors">
              {label}
            </span>
            {description ? (
              <span className="text-xs text-text-muted mt-1 leading-normal">
                {description}
              </span>
            ) : null}
          </div>
        ) : null}
      </label>

      {error ? (
        <p className="pl-8 text-xs text-debt font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
