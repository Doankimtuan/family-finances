"use client";

import { Toast as HeroToast, toast } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export type ToastProps = ComponentProps<typeof HeroToast>;

export function Toast({ className, ...props }: ToastProps) {
  return <HeroToast className={cn(className)} {...props} />;
}

Toast.Provider = HeroToast.Provider;
Toast.Content = HeroToast.Content;
Toast.Title = HeroToast.Title;
Toast.Description = HeroToast.Description;
Toast.Indicator = HeroToast.Indicator;
Toast.ActionButton = HeroToast.ActionButton;
Toast.CloseButton = HeroToast.CloseButton;

export { toast };
