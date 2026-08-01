"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type ButtonProps = HeroButtonProps;

export function Button({ className, ...props }: ButtonProps) {
  return <HeroButton className={cn(className)} {...props} />;
}
