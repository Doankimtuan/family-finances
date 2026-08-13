import type { ChangeEvent, ChangeEventHandler, ReactNode } from "react";
import { DatePickerField, FormField } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";

export type LabeledSelectOption = {
  id: string;
  label: string;
};

export type LabeledSelectProps = {
  label: ReactNode;
  value: string;
  options: LabeledSelectOption[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  "data-testid"?: string;
  className?: string;
  disabled?: boolean;
  hideLabel?: boolean;
};

/** Shared HeroUI Select for money-mutation forms; it retains legacy event shape. */
export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  description,
  error,
  required,
  "data-testid": testId,
  className,
  disabled,
  hideLabel = false,
}: LabeledSelectProps) {
  const id = testId ?? "select-field";
  const resolvedLabel = hideLabel ? <span className="sr-only">{label}</span> : label;

  return (
    <FormField
      id={id}
      label={resolvedLabel}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select
        id={id}
        className="w-full"
        selectedKey={value}
        isDisabled={disabled}
        isInvalid={Boolean(error)}
        aria-label={typeof label === "string" ? label : id}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid={testId}
        onSelectionChange={(key) => {
          if (key === "all" || key == null) return;
          onChange({ target: { value: String(key) } } as ChangeEvent<HTMLSelectElement>);
        }}
      >
        <Select.Trigger className="w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <Select.ListBox>
            {options.map((option) => (
              <Select.ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                {option.label}
              </Select.ListBox.Item>
            ))}
          </Select.ListBox>
        </Select.Popover>
      </Select>
    </FormField>
  );
}

type DataTestIdProp = { [key in `data-${"testid"}`]?: string };

export type LabeledDateInputProps = DataTestIdProp & {
  label: ReactNode;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  minValue?: string;
  maxValue?: string;
  className?: string;
  disabled?: boolean;
};

/** Shared HeroUI date picker for money-mutation forms; it retains legacy event shape. */
export function LabeledDateInput({
  label,
  value,
  onChange,
  description,
  error,
  required,
  minValue,
  maxValue,
  "data-testid": testId,
  className,
  disabled,
}: LabeledDateInputProps) {
  return (
    <DatePickerField
      id={testId ?? "date-field"}
      label={label}
      value={value}
      onChange={(next) => onChange({ target: { value: next } } as ChangeEvent<HTMLInputElement>)}
      description={description}
      error={error}
      required={required}
      minValue={minValue}
      maxValue={maxValue}
      isDisabled={disabled}
      data-testid={testId}
      className={className}
    />
  );
}
