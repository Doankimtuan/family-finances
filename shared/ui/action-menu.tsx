"use client";

import { Dropdown, Separator } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import {
  BUTTON_SIZE_STYLES,
  BUTTON_VARIANT_STYLES,
  ButtonSize,
  ButtonVariant,
} from "@/shared/ui/button";

export const ActionMenuItemVariant = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
  DANGER: "danger",
} as const;

export type ActionMenuItemVariant =
  (typeof ActionMenuItemVariant)[keyof typeof ActionMenuItemVariant];

type DropdownRootProps = ComponentProps<typeof Dropdown.Root>;
type DropdownTriggerProps = ComponentProps<typeof Dropdown.Trigger>;
type DropdownPopoverProps = ComponentProps<typeof Dropdown.Popover>;
type DropdownItemProps = ComponentProps<typeof Dropdown.Item>;
type DropdownSectionProps = ComponentProps<typeof Dropdown.Section>;

export type ActionMenuProps = DropdownRootProps;

/**
 * ViNha Canonical ActionMenu / DropdownMenu.
 * Strictly distinct from form Select.
 * Used for contextual action sheets and row menus (Edit, Archive, Delete, Manage).
 */
export function ActionMenu({ children, ...props }: ActionMenuProps) {
  return <Dropdown.Root {...props}>{children}</Dropdown.Root>;
}

export type ActionMenuTriggerProps = DropdownTriggerProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isIconOnly?: boolean;
};

/**
 * Trigger button for ActionMenu.
 * Automatically styles as a canonical ViNha button/icon-button while wrapping React Aria Menu trigger.
 */
export function ActionMenuTrigger({
  children,
  className,
  variant = ButtonVariant.OUTLINED,
  size = ButtonSize.MD,
  isIconOnly = false,
  ...props
}: ActionMenuTriggerProps) {
  const sizeClass = isIconOnly
    ? "min-h-11 min-w-11 p-0"
    : BUTTON_SIZE_STYLES[size];

  return (
    <Dropdown.Trigger
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-tight rounded-(--radius-control)",
        "transition-colors duration-(--duration-fast) cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        sizeClass,
        BUTTON_VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Dropdown.Trigger>
  );
}

export type ActionMenuContentProps = Omit<DropdownPopoverProps, "children"> & {
  children: ReactNode;
  menuClassName?: string;
  testId?: string;
};

/**
 * Canonical dropdown surface:
 * - Elevated surface (`bg-surface-elevated`)
 * - 1px hairline border (`border-border-subtle`)
 * - 12px card corner radius (`rounded-(--radius-card)`)
 * - Ambient depth shadow (`var(--elevation-2)`)
 * - Z-Index: 50 (`--z-dropdown` / `--z-scrim`)
 */
export function ActionMenuContent({
  children,
  className,
  menuClassName,
  placement = "bottom end",
  testId,
  ...props
}: ActionMenuContentProps) {
  return (
    <Dropdown.Popover
      placement={placement}
      className={cn(
        "z-(--z-dropdown) min-w-[180px] overflow-hidden rounded-(--radius-card)",
        "border border-border-subtle bg-surface-elevated p-1 shadow-[var(--elevation-2)]",
        "animate-in fade-in-0 zoom-in-95 data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95",
        className,
      )}
      {...props}
    >
      <Dropdown.Menu
        data-testid={testId}
        className={cn("flex flex-col gap-0.5 outline-none", menuClassName)}
      >
        {children}
      </Dropdown.Menu>
    </Dropdown.Popover>
  );
}

export type ActionMenuItemComponentProps = Omit<
  DropdownItemProps,
  "variant" | "children"
> & {
  children?: ReactNode;
  label?: ReactNode;
  icon?: ReactNode;
  shortcut?: ReactNode;
  variant?: ActionMenuItemVariant;
  className?: string;
};

export function ActionMenuItem({
  children,
  label,
  icon,
  shortcut,
  variant = ActionMenuItemVariant.DEFAULT,
  className,
  ...props
}: ActionMenuItemComponentProps) {
  const isDestructive =
    variant === ActionMenuItemVariant.DESTRUCTIVE ||
    variant === ActionMenuItemVariant.DANGER;

  return (
    <Dropdown.Item
      variant={isDestructive ? "danger" : "default"}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-(--space-2) rounded-(--radius-control) px-3 py-2 text-sm transition-colors",
        "outline-none select-none",
        isDestructive
          ? "text-danger hover:bg-danger/10 focus:bg-danger/10 data-[focused]:bg-danger/10"
          : "text-text-primary hover:bg-surface-muted focus:bg-surface-muted data-[focused]:bg-surface-muted",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-disabled",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-(--space-2) text-inherit">
        {icon ? (
          <span
            className="flex size-4.5 shrink-0 items-center justify-center text-inherit"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <span>{children ?? label}</span>
      </div>
      {shortcut ? (
        <span className="text-xs text-text-muted" aria-hidden>
          {shortcut}
        </span>
      ) : null}
    </Dropdown.Item>
  );
}

export function ActionMenuSeparator({ className }: { className?: string }) {
  return <Separator className={cn("my-1 h-px bg-border-subtle", className)} />;
}

export type ActionMenuSectionProps = Omit<DropdownSectionProps, "children"> & {
  title?: ReactNode;
  children: ReactNode;
};

export function ActionMenuSection({
  title,
  children,
  className,
  ...props
}: ActionMenuSectionProps) {
  return (
    <Dropdown.Section
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {title ? (
        <span className="px-3 py-1 text-xs font-medium text-text-muted select-none">
          {title}
        </span>
      ) : null}
      {children}
    </Dropdown.Section>
  );
}

ActionMenu.Trigger = ActionMenuTrigger;
ActionMenu.Content = ActionMenuContent;
ActionMenu.Item = ActionMenuItem;
ActionMenu.Separator = ActionMenuSeparator;
ActionMenu.Section = ActionMenuSection;
