"use client";

import { Select as HeroSelect, ListBox } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export type SelectProps = ComponentProps<typeof HeroSelect>;

export const FIELD_CONTROL_CLASS_NAME = cn(
  "min-h-11 w-full rounded-[var(--radius-control)]",
  "border border-border-subtle bg-surface text-text-primary",
  "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring focus-visible:shadow-[0_0_0_3px_var(--color-focus-ring-soft)]",
  "motion-reduce:transition-none",
);

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <HeroSelect className={cn("w-full", className)} {...props}>
      {children}
    </HeroSelect>
  );
}

const SelectTrigger = ({
  className,
  ...props
}: ComponentProps<typeof HeroSelect.Trigger>) => (
  <HeroSelect.Trigger
    className={cn(
      FIELD_CONTROL_CLASS_NAME,
      "flex h-11 w-full items-center px-(--space-3) py-0",
      className,
    )}
    {...props}
  />
);
SelectTrigger.displayName = "SelectTrigger";
Select.Trigger = SelectTrigger;

const SelectValue = ({
  className,
  ...props
}: ComponentProps<typeof HeroSelect.Value>) => (
  <HeroSelect.Value
    className={cn("flex min-h-0 flex-1 items-center leading-none", className)}
    {...props}
  />
);
SelectValue.displayName = "SelectValue";
Select.Value = SelectValue;
Select.Indicator = HeroSelect.Indicator;
const SelectPopover = ({
  className,
  children,
  ...props
}: ComponentProps<typeof HeroSelect.Popover>) => (
  <HeroSelect.Popover
    className={cn(
      "z-(--z-dropdown) max-h-[min(18rem,50dvh)] overflow-y-auto rounded-[var(--radius-overlay)]",
      "border border-border-subtle bg-surface-elevated text-text-primary shadow-[var(--elevation-2)]",
      className,
    )}
    {...props}
  >
    {children}
  </HeroSelect.Popover>
);
SelectPopover.displayName = "SelectPopover";
Select.Popover = SelectPopover;
Select.ListBox = ListBox;
