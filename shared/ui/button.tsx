"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/ui/spinner";

export const ButtonVariant = {
  PRIMARY: "primary",
  TONAL: "tonal",
  SECONDARY: "secondary",
  OUTLINED: "outlined",
  OUTLINE: "outline",
  TERTIARY: "tertiary",
  GHOST: "ghost",
  DESTRUCTIVE: "destructive",
  DANGER: "danger",
  FLAT: "flat",
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const BUTTON_VARIANT_VALUES = [
  ButtonVariant.PRIMARY,
  ButtonVariant.TONAL,
  ButtonVariant.SECONDARY,
  ButtonVariant.OUTLINED,
  ButtonVariant.OUTLINE,
  ButtonVariant.TERTIARY,
  ButtonVariant.GHOST,
  ButtonVariant.DESTRUCTIVE,
  ButtonVariant.DANGER,
  ButtonVariant.FLAT,
] as const;

export const ButtonSize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

export type ButtonProps = Omit<HeroButtonProps, "size" | "variant"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
};

export const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-hover shadow-sm",
  tonal:
    "bg-primary-soft text-primary hover:bg-primary-soft/80 active:bg-primary-soft/90",
  secondary:
    "bg-primary-soft text-primary hover:bg-primary-soft/80 active:bg-primary-soft/90",
  outlined:
    "border border-border-subtle bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  outline:
    "border border-border-subtle bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  tertiary:
    "border border-border-subtle bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-soft",
  destructive:
    "bg-debt text-white hover:bg-debt/90 active:bg-debt/95 shadow-sm",
  danger: "bg-debt text-white hover:bg-debt/90 active:bg-debt/95 shadow-sm",
  flat: "bg-surface-subtle text-text-primary hover:bg-surface-hover active:bg-surface-soft",
};

export const BUTTON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 min-h-9 px-3 text-xs gap-1.5 touch-target-expand-sm",
  md: "h-11 min-h-11 px-4 text-sm gap-2",
  lg: "h-13 min-h-13 px-5 text-base font-semibold gap-2.5",
};

const HERO_VARIANT: Record<
  ButtonVariant,
  "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger"
> = {
  [ButtonVariant.PRIMARY]: "primary",
  [ButtonVariant.TONAL]: "secondary",
  [ButtonVariant.SECONDARY]: "secondary",
  [ButtonVariant.OUTLINED]: "outline",
  [ButtonVariant.OUTLINE]: "outline",
  [ButtonVariant.TERTIARY]: "tertiary",
  [ButtonVariant.GHOST]: "ghost",
  [ButtonVariant.DESTRUCTIVE]: "danger",
  [ButtonVariant.DANGER]: "danger",
  [ButtonVariant.FLAT]: "secondary",
};

/**
 * Canonical ViNha Button primitive (Task 11 / Warm Precision).
 * Restricts actions to 5 canonical semantic variants and 3 standardized heights.
 */
export function Button({
  className,
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MD,
  isLoading = false,
  loadingText,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  isIconOnly,
  children,
  disabled,
  isDisabled: isDisabledProp,
  ...props
}: ButtonProps) {
  const variantClass = BUTTON_VARIANT_STYLES[variant];
  const sizeClass = BUTTON_SIZE_STYLES[size];
  const effectiveDisabled = disabled || isDisabledProp || isLoading;
  const heroVariant = HERO_VARIANT[variant];

  return (
    <HeroButton
      variant={heroVariant}
      size={size}
      isIconOnly={isIconOnly}
      isDisabled={effectiveDisabled}
      isPending={isLoading}
      data-loading={isLoading ? "true" : undefined}
      className={cn(
        "button inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium tracking-tight",
        `button--${variant}`,
        "transition-[transform,background-color,color,opacity,box-shadow,border-color] duration-(--duration-fast) ease-(--ease-standard)",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:transform-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100",
        !isIconOnly && sizeClass,
        isIconOnly && "min-h-11 min-w-11 p-0",
        fullWidth && "w-full",
        variantClass,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="size-4 shrink-0 text-current" />
          {loadingText ? (
            <span>{loadingText}</span>
          ) : typeof children === "function" ? null : (
            children
          )}
        </>
      ) : (
        <>
          {leadingIcon ? (
            <span className="inline-flex shrink-0">{leadingIcon}</span>
          ) : null}
          {typeof children === "function" ? (
            children
          ) : children != null ? (
            <span>{children}</span>
          ) : null}
          {trailingIcon ? (
            <span className="inline-flex shrink-0">{trailingIcon}</span>
          ) : null}
        </>
      )}
    </HeroButton>
  );
}
