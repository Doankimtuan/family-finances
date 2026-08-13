"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export function FilterChip({
  children,
  selected = false,
  onPress,
  isDisabled = false,
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress: () => void;
  isDisabled?: boolean;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={isDisabled}
      onClick={onPress}
      data-testid={testId}
      className={cn(
        "inline-flex min-h-10 max-w-full items-center justify-center rounded-full px-(--space-3) text-sm font-medium leading-tight transition-[background-color,color,box-shadow,transform,opacity] duration-(--duration-fast) ease-(--ease-standard) active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "bg-primary-soft text-primary ring-1 ring-primary/20"
          : "bg-surface-muted/65 text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        isDisabled && "cursor-not-allowed opacity-60 active:scale-100",
        className,
      )}
    >
      {children}
    </button>
  );
}
