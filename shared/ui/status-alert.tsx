"use client";

import type { ReactNode } from "react";
import { Alert, AlertVariant } from "@/shared/ui/alert";
import { cn } from "@/shared/utils/cn";

export type StatusAlertProps = {
  variant?: AlertVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Compact status Alert — title + optional description.
 * Prefer over repeating Alert.Indicator/Content/Title/Description.
 */
export function StatusAlert({
  variant = AlertVariant.INFO,
  title,
  description,
  action,
  className,
  "data-testid": testId,
}: StatusAlertProps) {
  return (
    <Alert
      variant={variant}
      className={cn("gap-(--space-3)", className)}
      data-testid={testId}
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description ? (
          <Alert.Description>{description}</Alert.Description>
        ) : null}
      </Alert.Content>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Alert>
  );
}
