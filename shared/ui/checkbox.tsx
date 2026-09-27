"use client";

import { useId, useState, type ReactNode } from "react";
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
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

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

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "group relative flex min-h-11 cursor-pointer items-start gap-3 py-1 select-none",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        <div className="relative flex size-5 shrink-0 items-center justify-center mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={resolvedChecked}
            disabled={disabled}
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
              (checked || indeterminate) &&
                "border-primary bg-primary text-primary-fg",
              disabled &&
                "peer-checked:bg-primary/50 peer-checked:border-transparent",
            )}
          >
            {indeterminate ? (
              <span className="block h-0.5 w-2.5 bg-current rounded-full" />
            ) : checked ? (
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
