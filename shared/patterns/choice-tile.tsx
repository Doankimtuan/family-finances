"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { Tick01Icon } from "@/shared/ui/stitch-icon-compat";

export const ChoiceTileLayout = {
  INLINE: "inline",
  STACKED: "stacked",
} as const;

export type ChoiceTileLayout =
  (typeof ChoiceTileLayout)[keyof typeof ChoiceTileLayout];

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
  layout?: ChoiceTileLayout;
};

/** Selectable row or stacked card with a dedicated selection slot. */
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
  layout = ChoiceTileLayout.INLINE,
}: ChoiceTileProps) {
  const indicator = (
    <span
      data-slot="choice-tile-indicator"
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        layout === ChoiceTileLayout.STACKED && "ml-auto",
        role ? "border bg-surface" : "bg-primary text-primary-fg",
        role && (selected ? "border-2 border-primary" : "border-border-strong"),
        !role && !selected && "invisible",
      )}
    >
      {role && selected ? (
        <span className="size-2 rounded-full bg-primary" />
      ) : null}
      {!role ? <AppIcon icon={Tick01Icon} size="sm" /> : null}
    </span>
  );
  const content = (
    <span
      data-slot="choice-tile-content"
      className="block min-w-0 flex-1 break-words"
    >
      {children ?? (
        <Text
          size="sm"
          weight="medium"
          className="min-w-0 line-clamp-2 text-pretty leading-snug text-text-primary"
        >
          {label}
        </Text>
      )}
    </span>
  );

  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      disabled={isDisabled}
      data-testid={testId}
      data-layout={layout}
      onClick={onPress}
      className={cn(
        "relative flex h-full min-h-11 min-w-0 w-full gap-(--space-2) rounded-(--radius-control) border px-(--space-3) py-(--space-2) text-left",
        layout === ChoiceTileLayout.STACKED
          ? "flex-col items-stretch justify-start"
          : "items-center",
        "transition-[background-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "border-primary/25 bg-primary-soft shadow-(--elevation-1) ring-1 ring-primary/20"
          : "border-transparent bg-surface-muted hover:bg-surface-hover",
        className,
      )}
    >
      {layout === ChoiceTileLayout.STACKED ? (
        <>
          <span
            data-slot="choice-tile-header"
            className="flex items-center gap-(--space-2)"
          >
            {icon}
            {indicator}
          </span>
          {content}
        </>
      ) : (
        <>
          {icon}
          {content}
          {indicator}
        </>
      )}
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
