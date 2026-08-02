"use client";

import {
  Alert as HeroAlert,
  type AlertRootProps as HeroAlertProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

/** Design System variants (Alert.md) mapped onto HeroUI `status`. */
export type AlertVariant = "info" | "warning" | "danger" | "success";

const VARIANT_TO_STATUS = {
  info: "accent",
  warning: "warning",
  danger: "danger",
  success: "success",
} as const satisfies Record<
  AlertVariant,
  NonNullable<HeroAlertProps["status"]>
>;

export type AlertProps = Omit<HeroAlertProps, "status"> & {
  variant?: AlertVariant;
};

/**
 * HeroUI Alert with Design System variant names (info / warning / danger / success).
 */
export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <HeroAlert
      status={VARIANT_TO_STATUS[variant]}
      className={cn("rounded-md", className)}
      {...props}
    />
  );
}

Alert.Root = Alert;
Alert.Indicator = HeroAlert.Indicator;
Alert.Content = HeroAlert.Content;
Alert.Title = HeroAlert.Title;
Alert.Description = HeroAlert.Description;
