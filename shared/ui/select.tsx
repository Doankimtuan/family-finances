"use client";

import { Select as HeroSelect, ListBox } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export type SelectProps = ComponentProps<typeof HeroSelect>;

const fieldChrome = cn(
  "min-h-11 w-full rounded-md",
  "border border-border-subtle bg-surface text-text-primary",
  "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "motion-reduce:transition-none",
);

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <HeroSelect className={cn(fieldChrome, className)} {...props}>
      {children}
    </HeroSelect>
  );
}

Select.Trigger = HeroSelect.Trigger;
Select.Value = HeroSelect.Value;
Select.Indicator = HeroSelect.Indicator;
Select.Popover = HeroSelect.Popover;
Select.ListBox = ListBox;
