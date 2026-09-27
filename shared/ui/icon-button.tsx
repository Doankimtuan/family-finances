"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/ui/spinner";

export const IconButtonVariant = {
  GHOST: "ghost",
  SURFACE: "surface",
  DESTRUCTIVE: "destructive",
  PRIMARY: "primary",
  // Compatibility aliases
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  OUTLINE: "outline",
} as const;

export type IconButtonVariant =
  (typeof IconButtonVariant)[keyof typeof IconButtonVariant];

export const IconButtonSize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type IconButtonSize =
  (typeof IconButtonSize)[keyof typeof IconButtonSize];

export type IconButtonProps = Omit<
  HeroButtonProps,
  "isIconOnly" | "variant" | "size"
> & {
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

const VARIANT_STYLES: Record<string, string> = {
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  surface:
    "border border-border-subtle bg-surface text-text-primary hover:bg-surface-hover active:bg-surface-soft shadow-xs",
  secondary:
    "border border-border-subtle bg-surface text-text-primary hover:bg-surface-hover active:bg-surface-soft shadow-xs",
  tertiary:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  outline:
    "border border-border-subtle bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary",
  destructive:
    "bg-debt-soft text-debt hover:bg-debt-soft/80 active:bg-debt-soft/90",
  primary:
    "bg-primary-soft text-primary hover:bg-primary-soft/80 active:bg-primary-soft/90",
};

const SIZE_STYLES: Record<IconButtonSize, string> = {
  sm: "size-9 min-h-9 min-w-9 touch-target-expand-sm",
  md: "size-11 min-h-11 min-w-11",
  lg: "size-13 min-h-13 min-w-13",
};

/**
 * Canonical ViNha IconButton primitive (Task 11 / Warm Precision).
 * Enforces accessible label and 44x44px minimum touch target compliance.
 */
export function IconButton({
  className,
  variant = IconButtonVariant.GHOST,
  size = IconButtonSize.MD,
  isLoading = false,
  icon,
  children,
  disabled,
  isDisabled: isDisabledProp,
  ...props
}: IconButtonProps) {
  const variantClass = VARIANT_STYLES[variant] ?? VARIANT_STYLES.ghost;
  const sizeClass = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const effectiveDisabled = disabled || isDisabledProp || isLoading;

  return (
    <HeroButton
      isIconOnly
      isDisabled={effectiveDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        "button inline-flex items-center justify-center rounded-[var(--radius-control)] p-0",
        "transition-[transform,background-color,color,opacity,box-shadow,border-color] duration-(--duration-fast) ease-(--ease-standard)",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:transform-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100",
        sizeClass,
        variantClass,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Spinner className="size-4 shrink-0 text-current" />
      ) : (
        (icon ?? children)
      )}
    </HeroButton>
  );
}
