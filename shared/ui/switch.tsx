"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type SwitchProps = {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha Switch primitive (Task 11 / Warm Precision).
 * Exclusively for immediate-effect binary settings.
 * Enforces 44x24px track, 20x20px knob, 150ms motion, and accessible role="switch".
 */
export function Switch({
  id: idProp,
  checked,
  defaultChecked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  "data-testid": testId,
}: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange?.(e.target.checked);
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1 select-none",
        disabled && "cursor-not-allowed opacity-45",
        className,
      )}
    >
      {label ? (
        <div className="flex flex-col text-sm leading-tight flex-1 min-w-0">
          <span className="font-medium text-text-primary group-hover:text-primary transition-colors truncate">
            {label}
          </span>
          {description ? (
            <span className="text-xs text-text-muted mt-0.5 leading-normal">
              {description}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={handleChange}
          data-testid={testId}
          aria-checked={checked}
          className="peer sr-only"
        />
        {/* 44x24px Track */}
        <div
          className={cn(
            "h-6 w-11 rounded-full p-0.5 transition-colors duration-(--duration-fast) ease-(--ease-standard)",
            "border border-border-strong bg-surface-soft",
            "peer-checked:border-primary peer-checked:bg-primary",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
            "motion-reduce:transition-none",
          )}
        >
          {/* 20x20px Thumb */}
          <div
            className={cn(
              "size-5 rounded-full bg-white shadow-xs transition-transform duration-(--duration-fast) ease-(--ease-standard)",
              "translate-x-0 peer-checked:translate-x-5",
              "group-active:scale-x-110 motion-reduce:transition-none motion-reduce:group-active:transform-none",
            )}
          />
        </div>
      </div>
    </label>
  );
}
