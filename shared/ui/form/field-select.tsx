"use client";

/* eslint-disable jsx-a11y/role-supports-aria-props -- FieldSelect exposes the requested readonly and validation metadata on its trigger. */

import type { ReactNode } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { AppIcon } from "@/shared/ui/app-icon";
import { FIELD_CONTROL_CLASS_NAME } from "@/shared/ui/select";
import { cn } from "@/shared/utils/cn";
import { FormField, formFieldA11y } from "./form-field";

export type FieldSelectProps = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  "data-testid"?: string;
};

/** Read-only field trigger for sheets and other custom selection surfaces. */
export function FieldSelect({
  id,
  label,
  value,
  description,
  error,
  required,
  isDisabled,
  onPress,
  "data-testid": testId,
}: FieldSelectProps) {
  const hasError = Boolean(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description));

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <button
        type="button"
        className={cn(
          FIELD_CONTROL_CLASS_NAME,
          "flex items-center justify-between px-(--space-3) py-0 text-left font-normal",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        disabled={isDisabled}
        onClick={onPress}
        aria-readonly="true"
        {...a11y}
        data-testid={testId}
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <AppIcon icon={ArrowDown01Icon} size="sm" />
      </button>
    </FormField>
  );
}
