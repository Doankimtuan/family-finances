import type { ChangeEventHandler, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

const fieldClassName =
  "min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm";

export type LabeledSelectOption = {
  id: string;
  label: string;
};

export type LabeledSelectProps = {
  label: ReactNode;
  value: string;
  options: LabeledSelectOption[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
  "data-testid"?: string;
  className?: string;
  disabled?: boolean;
};

/** Native select with label above — shared money mutation form control. */
export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  "data-testid": testId,
  className,
  disabled,
}: LabeledSelectProps) {
  return (
    <label className={cn("flex flex-col gap-(--space-1)", className)}>
      <span className="text-sm text-text-secondary">{label}</span>
      <select
        className={fieldClassName}
        value={value}
        onChange={onChange}
        data-testid={testId}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export type LabeledDateInputProps = {
  label: ReactNode;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  "data-testid"?: string;
  className?: string;
  disabled?: boolean;
};

/** Native date input with label above — shared money mutation form control. */
export function LabeledDateInput({
  label,
  value,
  onChange,
  "data-testid": testId,
  className,
  disabled,
}: LabeledDateInputProps) {
  return (
    <label className={cn("flex flex-col gap-(--space-1)", className)}>
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type="date"
        className={fieldClassName}
        value={value}
        onChange={onChange}
        data-testid={testId}
        disabled={disabled}
      />
    </label>
  );
}
