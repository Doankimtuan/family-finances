"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export type ChoiceTileProps = {
  label?: string;
  children?: ReactNode;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  role?: "radio";
  isDisabled?: boolean;
  testId?: string;
  className?: string;
};

/**
 * Compact two-up selector tile. Pair inside ChoiceTileGroup so labels share
 * one baseline and the hint lives under the row, not inside each card.
 */
export function ChoiceTile({
  label,
  children,
  selected,
  onPress,
  icon,
  role,
  isDisabled = false,
  testId,
  className,
}: ChoiceTileProps) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      disabled={isDisabled}
      data-testid={testId}
      onClick={onPress}
      className={cn(
        "relative flex h-full min-h-11 w-full items-center gap-(--space-2) rounded-(--radius-control) border px-(--space-3) py-(--space-2) pr-(--space-7) text-left",
        "transition-[background-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "border-primary/25 bg-primary-soft shadow-(--elevation-1) ring-1 ring-primary/20"
          : "border-transparent bg-surface-muted hover:bg-surface-hover",
        className,
      )}
    >
      {icon}
      {children ?? (
        <Text
          size="sm"
          weight="medium"
          className="min-w-0 line-clamp-2 text-pretty leading-snug text-text-primary"
        >
          {label}
        </Text>
      )}
      {selected ? (
        <span
          className="absolute right-(--space-2) top-(--space-2) flex size-5 items-center justify-center rounded-full bg-primary text-primary-fg"
          aria-hidden
        >
          <AppIcon icon={CheckmarkCircle02Icon} size="xs" />
        </span>
      ) : null}
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
