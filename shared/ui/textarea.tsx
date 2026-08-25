"use client";

import {
  TextArea as HeroTextArea,
  type TextAreaProps as HeroTextAreaProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type TextareaProps = HeroTextAreaProps;

const fieldChrome = cn(
  "min-h-24 w-full rounded-(--radius-control)",
  "border border-border-subtle bg-surface text-text-primary",
  "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-standard)",
  "placeholder:text-text-muted",
  "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "motion-reduce:transition-none",
);

export function Textarea({ className, ...props }: TextareaProps) {
  return <HeroTextArea className={cn(fieldChrome, className)} {...props} />;
}
