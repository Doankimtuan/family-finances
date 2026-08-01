"use client";

import {
  TextArea as HeroTextArea,
  type TextAreaProps as HeroTextAreaProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type TextareaProps = HeroTextAreaProps;

export function Textarea({ className, ...props }: TextareaProps) {
  return <HeroTextArea className={cn(className)} {...props} />;
}
