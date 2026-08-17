"use client";

import type { ReactNode } from "react";
import { Select } from "@/shared/ui/select";
import { FormField, formFieldA11y } from "./form-field";

export type SelectFieldOption = {
  id: string;
  label: ReactNode;
};

export type SelectFieldProps = {
  id: string;
  label: ReactNode;
  /** Selected option id; `""` is the empty state (nothing selected). */
  value: string;
  /** Receives the selected option id, or `""` when the selection is cleared. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly SelectFieldOption[];
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

/** Normalizes a HeroUI selection key to the shared string/empty-state contract. */
export function selectKeyValue(key: React.Key | null): string {
  return key == null ? "" : String(key);
}

/**
 * HeroUI Select with the shared label, validation, and a11y contract.
 * Controlled `value`/`onChange` — integrate with RHF via `Controller`.
 */
export function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  description,
  error,
  required,
  isDisabled,
  className,
  "data-testid": testId,
}: SelectFieldProps) {
  const hasError = Boolean(error);
  const a11y = formFieldA11y(id, hasError, Boolean(description));

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select
        {...a11y}
        aria-label={typeof label === "string" ? label : id}
        className="w-full"
        selectedKey={value || null}
        onSelectionChange={(key) => onChange(selectKeyValue(key))}
        onBlur={onBlur}
        isDisabled={isDisabled}
        isInvalid={hasError}
        data-testid={testId}
      >
        {/* HeroUI v3 Select strips `aria-invalid` from the trigger; the
            FormField error link (aria-describedby) carries the error a11y. */}
        <Select.Trigger className="w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <Select.ListBox>
            {options.map((option) => (
              <Select.ListBox.Item
                key={option.id}
                id={option.id}
                textValue={
                  typeof option.label === "string" ? option.label : option.id
                }
              >
                {option.label}
              </Select.ListBox.Item>
            ))}
          </Select.ListBox>
        </Select.Popover>
      </Select>
    </FormField>
  );
}
