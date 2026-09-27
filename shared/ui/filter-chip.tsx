"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type FilterChipProps = {
  children: ReactNode;
  selected?: boolean;
  onPress: () => void;
  count?: number | string;
  icon?: ReactNode;
  isDisabled?: boolean;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

export function FilterChip({
  children,
  selected = false,
  onPress,
  count,
  icon,
  isDisabled = false,
  disabled = false,
  className,
  "data-testid": testId,
}: FilterChipProps) {
  const effectiveDisabled = isDisabled || disabled;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={effectiveDisabled}
      onClick={onPress}
      data-testid={testId}
      className={cn(
        "inline-flex h-11 min-h-11 shrink-0 items-center justify-center gap-(--space-1.5) rounded-full px-(--space-3) text-xs font-medium leading-none whitespace-nowrap select-none",
        "border transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard)",
        "active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        icon && "ps-(--space-2.5)",
        selected
          ? "border-primary bg-primary-soft text-primary font-semibold shadow-xs"
          : "border-border-subtle bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
        effectiveDisabled &&
          "cursor-not-allowed opacity-45 pointer-events-none active:scale-100",
        className,
      )}
    >
      {icon ? <span className="flex shrink-0">{icon}</span> : null}
      <span>{children}</span>
      {count !== undefined ? (
        <span
          className={cn(
            "ml-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
            selected
              ? "bg-primary text-primary-fg"
              : "bg-surface-subtle text-text-muted",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
