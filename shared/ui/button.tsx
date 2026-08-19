"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export const ButtonVariant = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  OUTLINE: "outline",
  GHOST: "ghost",
  DANGER: "danger",
  FLAT: "flat",
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const BUTTON_VARIANT_VALUES = [
  ButtonVariant.PRIMARY,
  ButtonVariant.SECONDARY,
  ButtonVariant.TERTIARY,
  ButtonVariant.OUTLINE,
  ButtonVariant.GHOST,
  ButtonVariant.DANGER,
  ButtonVariant.FLAT,
] as const;

export type ButtonProps = HeroButtonProps;

/**
 * HeroUI Button with Calm Ledger token classes.
 * Prefer variant="primary" for brand CTAs.
 */
export function Button({
  className,
  variant = ButtonVariant.PRIMARY,
  isIconOnly,
  ...props
}: ButtonProps) {
  return (
    <HeroButton
      variant={variant}
      isIconOnly={isIconOnly}
      className={cn(
        "button rounded-(--radius-control) font-medium tracking-tight",
        "transition-[transform,background-color,color,opacity,box-shadow] active:scale-(--press-scale)",
        "duration-(--duration-fast) ease-(--ease-standard)",
        "motion-reduce:transition-none motion-reduce:active:transform-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        !isIconOnly && "min-h-11 px-(--space-4) shadow-none",
        isIconOnly && "min-h-11 min-w-11 p-0 shadow-none",
        variant === "primary" && "shadow-(--elevation-1) hover:-translate-y-px",
        className,
      )}
      {...props}
    />
  );
}
