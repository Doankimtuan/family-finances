"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type ChoiceTileProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: ReactNode;
  role?: "radio";
  isDisabled?: boolean;
  className?: string;
};

/**
 * Compact two-up selector tile. Pair inside ChoiceTileGroup so labels share
 * one baseline and the hint lives under the row, not inside each card.
 */
export function ChoiceTile({
  label,
  selected,
  onPress,
  icon,
  role,
  isDisabled = false,
  className,
}: ChoiceTileProps) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      disabled={isDisabled}
      onClick={onPress}
      className={cn(
        "flex h-full min-h-11 w-full items-center gap-(--space-2) rounded-(--radius-control) px-(--space-3) py-(--space-2) text-left",
        "transition-[background-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "bg-primary-soft ring-1 ring-primary/20"
          : "bg-surface-muted",
        className,
      )}
    >
      {icon}
      <Text
        size="sm"
        weight="medium"
        className="min-w-0 line-clamp-2 text-pretty leading-snug text-text-primary"
      >
        {label}
      </Text>
    </button>
  );
}

export type ChoiceTileGroupProps = {
  children: ReactNode;
  hint?: string;
  className?: string;
};

export function ChoiceTileGroup({
  children,
  hint,
  className,
}: ChoiceTileGroupProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-2)", className)}>
      <div className="grid grid-cols-2 items-stretch gap-(--space-2)">
        {children}
      </div>
      {hint ? (
        <Text size="sm" tone="secondary" className="leading-snug">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}
