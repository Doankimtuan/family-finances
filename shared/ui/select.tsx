"use client";

import { Select as HeroSelect, ListBox } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { ArrowDown01Icon, Tick01Icon } from "@/shared/ui/stitch-icon-compat";
import { AppIcon } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";

export type SelectProps = ComponentProps<typeof HeroSelect>;

export const FIELD_CONTROL_CLASS_NAME = cn(
  "h-12 min-h-12 w-full rounded-[var(--radius-control)]",
  "border border-border-subtle bg-surface text-text-primary text-base md:text-sm",
  "shadow-xs transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "hover:border-border-strong",
  "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-surface-subtle",
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
  children,
  leadingIcon,
  hasError,
  ...props
}: ComponentProps<typeof HeroSelect.Trigger> & {
  leadingIcon?: ReactNode;
  hasError?: boolean;
}) => (
  <HeroSelect.Trigger
    className={cn(
      FIELD_CONTROL_CLASS_NAME,
      "group flex h-11 items-center justify-between px-3.5 py-0 text-left font-normal cursor-pointer select-none",
      hasError &&
        "border-debt focus-visible:border-debt focus-visible:outline-debt",
      className,
    )}
    {...props}
  >
    {(values) => (
      <>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {leadingIcon ? (
            <span className="flex shrink-0 text-text-muted">{leadingIcon}</span>
          ) : null}
          {typeof children === "function" ? children(values) : children}
        </div>
        <span className="flex shrink-0 text-text-muted transition-transform duration-(--duration-fast) group-data-[open=true]:rotate-180">
          <AppIcon icon={ArrowDown01Icon} size="sm" />
        </span>
      </>
    )}
  </HeroSelect.Trigger>
);
SelectTrigger.displayName = "SelectTrigger";
Select.Trigger = SelectTrigger;

const SelectValue = ({
  className,
  ...props
}: ComponentProps<typeof HeroSelect.Value>) => (
  <HeroSelect.Value
    className={cn(
      "flex min-h-0 flex-1 items-center leading-none text-text-primary truncate",
      className,
    )}
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
      "z-(--z-dropdown) max-h-80 w-[var(--trigger-width)] overflow-y-auto rounded-[var(--radius-card)] p-1",
      "border border-border-subtle bg-surface-elevated text-text-primary shadow-lg",
      "animate-in fade-in zoom-in-95 duration-100",
      className,
    )}
    {...props}
  >
    {children}
  </HeroSelect.Popover>
);
SelectPopover.displayName = "SelectPopover";
Select.Popover = SelectPopover;

export type SelectItemProps = ComponentProps<typeof ListBox.Item> & {
  leadingIcon?: ReactNode;
  secondaryText?: ReactNode;
  isSelected?: boolean;
};

const SelectItem = ({
  className,
  children,
  leadingIcon,
  secondaryText,
  isSelected,
  ...props
}: SelectItemProps) => (
  <ListBox.Item
    className={cn(
      "relative flex min-h-11 w-full cursor-pointer items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-sm",
      "transition-colors duration-100 outline-none select-none",
      "hover:bg-surface-subtle focus-visible:bg-surface-subtle",
      "data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary font-medium",
      "data-[disabled=true]:opacity-45 data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed",
      className,
    )}
    {...props}
  >
    {(values) => (
      <>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {leadingIcon ? (
            <span className="flex shrink-0 text-text-muted">{leadingIcon}</span>
          ) : null}
          <div className="flex flex-col min-w-0">
            <span className="truncate leading-tight text-text-primary">
              {typeof children === "function" ? children(values) : children}
            </span>
            {secondaryText ? (
              <span className="truncate text-xs text-text-muted leading-tight mt-0.5">
                {secondaryText}
              </span>
            ) : null}
          </div>
        </div>
        {isSelected ? (
          <span className="flex shrink-0 text-primary pl-2">
            <AppIcon icon={Tick01Icon} size="sm" />
          </span>
        ) : null}
      </>
    )}
  </ListBox.Item>
);
SelectItem.displayName = "SelectItem";

Select.ListBox = ListBox;
Select.Item = SelectItem;
