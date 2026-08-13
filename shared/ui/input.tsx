"use client";

import {
  Input as HeroInput,
  type InputProps as HeroInputProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type InputProps = HeroInputProps;

const fieldChrome = cn(
  "min-h-11 w-full rounded-[var(--radius-control)]",
  "border border-border-subtle bg-surface text-text-primary",
  "shadow-[var(--elevation-0)]",
  "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "placeholder:text-text-muted",
  "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring focus-visible:shadow-[0_0_0_3px_var(--color-focus-ring-soft)]",
  "motion-reduce:transition-none",
);

/**
 * HeroUI Input with Calm Ledger field chrome.
 */
export function Input({ className, ...props }: InputProps) {
  return <HeroInput className={cn(fieldChrome, className)} {...props} />;
}
