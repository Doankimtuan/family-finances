"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type ButtonProps = HeroButtonProps;

/**
 * HeroUI Button with Calm Ledger token classes.
 * Prefer variant="primary" for brand CTAs.
 */
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <HeroButton
      variant={variant}
      className={cn(
        "rounded-[var(--radius-md)] font-medium transition-[transform,background-color,color,opacity]",
        "duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
        "motion-reduce:transition-none motion-reduce:active:transform-none",
        className,
      )}
      {...props}
    />
  );
}
