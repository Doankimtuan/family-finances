"use client";

import {
  Input as HeroInput,
  type InputProps as HeroInputProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type InputProps = HeroInputProps;

export function Input({ className, ...props }: InputProps) {
  return <HeroInput className={cn(className)} {...props} />;
}
