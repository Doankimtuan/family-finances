"use client";

import {
  Spinner as HeroSpinner,
  type SpinnerProps as HeroSpinnerProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type SpinnerProps = HeroSpinnerProps;

export function Spinner({ className, ...props }: SpinnerProps) {
  return <HeroSpinner className={cn(className)} {...props} />;
}
