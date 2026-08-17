"use client";

import type { ReactNode } from "react";
import { Alert, AlertVariant } from "@/shared/ui/alert";

export type StatusAlertProps = {
  variant?: AlertVariant;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

/**
 * Compact status Alert — title + optional description.
 * Prefer over repeating Alert.Indicator/Content/Title/Description.
 */
export function StatusAlert({
  variant = AlertVariant.INFO,
  title,
  description,
  className,
}: StatusAlertProps) {
  return (
    <Alert variant={variant} className={className}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description ? (
          <Alert.Description>{description}</Alert.Description>
        ) : null}
      </Alert.Content>
    </Alert>
  );
}
