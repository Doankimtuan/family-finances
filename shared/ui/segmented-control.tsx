"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import { handleTabKeyDown } from "./tab-keyboard";

export type SegmentedControlOption<T extends string = string> = {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha SegmentedControl primitive (Task 11 / Warm Precision).
 * Enforces 36px height, 10px container radius, 8px active segment pill,
 * and clear keyboard/tactile interactions for mode switching.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  className,
  "data-testid": testId,
}: SegmentedControlProps<T>) {
  const tA11y = useTranslations("a11y");
  return (
    <div
      role="tablist"
      aria-label={tA11y("viewTabs")}
      data-testid={testId}
      className={cn(
        "relative flex h-9 min-h-9 w-full items-center rounded-[var(--radius-control)] bg-surface-soft p-[3px] select-none border border-border-subtle/50",
        disabled && "opacity-45 pointer-events-none cursor-not-allowed",
        className,
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.id === value;
        const isItemDisabled = disabled || opt.disabled;

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            data-tab-id={opt.id}
            tabIndex={isSelected ? 0 : -1}
            aria-selected={isSelected}
            disabled={isItemDisabled}
            onClick={() => onChange(opt.id)}
            onKeyDown={(event) =>
              handleTabKeyDown(event, options, disabled, onChange)
            }
            className={cn(
              "relative flex h-full flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-medium transition-[background-color,color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard)",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
              "motion-reduce:transition-none active:scale-[0.98]",
              isSelected
                ? "bg-surface text-text-primary font-semibold shadow-xs"
                : "text-text-secondary hover:text-text-primary",
              isItemDisabled &&
                "cursor-not-allowed opacity-45 active:scale-100",
            )}
          >
            {opt.icon ? (
              <span className="flex shrink-0">{opt.icon}</span>
            ) : null}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
