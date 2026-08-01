"use client";

import { Select as HeroSelect, ListBox } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export type SelectProps = ComponentProps<typeof HeroSelect>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <HeroSelect className={cn(className)} {...props}>
      {children}
    </HeroSelect>
  );
}

Select.Trigger = HeroSelect.Trigger;
Select.Value = HeroSelect.Value;
Select.Indicator = HeroSelect.Indicator;
Select.Popover = HeroSelect.Popover;
Select.ListBox = ListBox;
