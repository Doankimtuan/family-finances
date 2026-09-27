"use client";

import { Dropdown, Separator } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { ButtonVariant, ButtonSize } from "@/shared/ui/button";

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

const TRIGGER_VARIANT_STYLES: Record<string, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-xs",
  tonal:
    "bg-primary-soft text-primary hover:bg-primary-soft/80 active:bg-primary-soft/90",
  secondary:
    "bg-surface-muted text-text-primary hover:bg-surface-muted/80 active:bg-surface-muted/90",
  outlined:
    "border border-border-default bg-surface-base text-text-primary hover:bg-surface-muted active:bg-surface-muted/80",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-muted active:bg-surface-muted/80",
  destructive:
    "bg-danger text-danger-fg hover:bg-danger-hover active:bg-danger-active shadow-xs",
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
  const variantClass =
    TRIGGER_VARIANT_STYLES[variant] ?? TRIGGER_VARIANT_STYLES.outlined;
  const isSm = size === ButtonSize.SM;
  const isLg = size === ButtonSize.LG;

  return (
    <Dropdown.Trigger
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-tight rounded-(--radius-control)",
        "transition-colors duration-(--duration-fast) cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        isIconOnly
          ? isSm
            ? "size-9 p-0"
            : isLg
              ? "size-12 p-0"
              : "size-11 p-0"
          : isSm
            ? "h-9 px-3 text-xs gap-1.5"
            : isLg
              ? "h-12 px-5 text-base gap-2.5"
              : "h-11 px-4 text-sm gap-2",
        variantClass,
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
