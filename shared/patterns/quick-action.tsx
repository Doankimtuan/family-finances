"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

export type QuickActionProps = {
  label: ReactNode;
  icon?: ReactNode;
  onPress?: () => void;
  href?: string;
  isDisabled?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
  "data-testid"?: string;
};

/**
 * Thumb-zone shortcut (Design System QuickAction).
 */
export function QuickAction({
  label,
  icon,
  onPress,
  isDisabled,
  variant = "primary",
  className,
  "data-testid": testId,
}: QuickActionProps) {
  return (
    <Button
      variant={variant}
      className={cn("min-h-12 w-full gap-(--space-2)", className)}
      onPress={onPress}
      isDisabled={isDisabled}
      data-testid={testId}
    >
      {icon}
      {label}
    </Button>
  );
}
