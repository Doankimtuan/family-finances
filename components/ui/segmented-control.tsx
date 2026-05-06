"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

export function SegmentedControl({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 shadow-sm sm:rounded-2xl",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-inset ring-border"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
