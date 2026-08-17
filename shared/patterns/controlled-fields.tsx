"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import {
  useController,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";
import { AmountField } from "./amount-field";
import { DecimalField } from "./decimal-field";
import { PercentageField } from "./percentage-field";
import {
  DatePickerField,
  NumberField,
  SelectField,
  type SelectFieldOption,
} from "@/shared/ui/form";

type EmptyValue = "" | null | undefined;

type BaseFieldConfig<TValues extends FieldValues> = {
  name: FieldPath<TValues>;
  label: ReactNode;
  id?: string;
  testId?: string;
  description?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  className?: string;
  error?: string;
};

type EmptyFieldConfig = {
  emptyValue?: EmptyValue;
};

type NumberName<TValues extends FieldValues> = FieldPathByValue<
  TValues,
  number | null | undefined
>;
type StringName<TValues extends FieldValues> = FieldPathByValue<
  TValues,
  string | null | undefined
>;

type NumericFieldConfig<TValues extends FieldValues> =
  BaseFieldConfig<TValues> & {
    name: NumberName<TValues>;
    minValue?: number;
    maxValue?: number;
    step?: number;
    formatOptions?: Intl.NumberFormatOptions;
  };

export type NumberFieldConfig<TValues extends FieldValues> =
  NumericFieldConfig<TValues> & { type: "number" };

export type PercentageFieldConfig<TValues extends FieldValues> =
  NumericFieldConfig<TValues> & { type: "percentage" };

export type AmountFieldConfig<TValues extends FieldValues> =
  BaseFieldConfig<TValues> &
    EmptyFieldConfig & {
      type: "amount";
      name: NumberName<TValues>;
      placeholder?: string;
      locale?: string;
    };

export type SelectFieldConfig<TValues extends FieldValues> =
  BaseFieldConfig<TValues> &
    EmptyFieldConfig & {
      type: "select";
      name: StringName<TValues>;
      options: readonly SelectFieldOption[];
    };

export type DateFieldConfig<TValues extends FieldValues> =
  BaseFieldConfig<TValues> &
    EmptyFieldConfig & {
      type: "date";
      name: StringName<TValues>;
      minValue?: string;
      maxValue?: string;
    };

export type DecimalFieldConfig<TValues extends FieldValues> =
  BaseFieldConfig<TValues> &
    EmptyFieldConfig & {
      type: "decimal";
      name: StringName<TValues>;
      placeholder?: string;
    };

export type ControlledFieldConfig<TValues extends FieldValues> =
  | NumberFieldConfig<TValues>
  | PercentageFieldConfig<TValues>
  | AmountFieldConfig<TValues>
  | SelectFieldConfig<TValues>
  | DateFieldConfig<TValues>
  | DecimalFieldConfig<TValues>;

export type ControlledFieldsProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  fields: readonly ControlledFieldConfig<TValues>[];
  getErrorMessage?: (error: FieldError) => string;
};

type ControlledFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  field: ControlledFieldConfig<TValues>;
  getErrorMessage?: (error: FieldError) => string;
};

function errorMessage(
  fieldError: FieldError | undefined,
  configuredError: string | undefined,
  getErrorMessage: ((error: FieldError) => string) | undefined,
) {
  if (configuredError !== undefined) return configuredError;
  return fieldError && getErrorMessage
    ? getErrorMessage(fieldError)
    : fieldError?.message;
}

function emptyValue<T>(
  value: T,
  field: { emptyValue?: EmptyValue },
  fallback: T,
) {
  const isEmpty = value === "" || value === null || value === undefined;
  if (!isEmpty) return value;
  return "emptyValue" in field ? field.emptyValue : fallback;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported controlled field: ${String(value)}`);
}

function ControlledNumberField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues> & {
  field: NumberFieldConfig<TValues> | PercentageFieldConfig<TValues>;
}) {
  const { field: controllerField, fieldState } = useController({
    control,
    name: field.name,
  });
  const value =
    typeof controllerField.value === "number"
      ? controllerField.value
      : undefined;
  const props = {
    id: field.id ?? "",
    label: field.label,
    value,
    onChange: controllerField.onChange,
    onBlur: controllerField.onBlur,
    minValue: field.minValue,
    maxValue: field.maxValue,
    step: field.step,
    formatOptions: field.formatOptions,
    description: field.description,
    required: field.required,
    isDisabled: field.isDisabled,
    className: field.className,
    "data-testid": field.testId,
    error: errorMessage(fieldState.error, field.error, getErrorMessage),
  };

  return field.type === "percentage" ? (
    <PercentageField {...props} />
  ) : (
    <NumberField {...props} />
  );
}

function ControlledAmountField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues> & { field: AmountFieldConfig<TValues> }) {
  const { field: controllerField, fieldState } = useController({
    control,
    name: field.name,
  });
  const value =
    typeof controllerField.value === "number" ? controllerField.value : null;

  return (
    <AmountField
      id={field.id ?? ""}
      label={field.label}
      value={value}
      onValueChange={(next) =>
        controllerField.onChange(emptyValue(next, field, null))
      }
      onBlur={controllerField.onBlur}
      placeholder={field.placeholder}
      locale={field.locale}
      description={field.description}
      required={field.required}
      disabled={field.isDisabled}
      className={field.className}
      data-testid={field.testId}
      error={errorMessage(fieldState.error, field.error, getErrorMessage)}
    />
  );
}

function ControlledSelectField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues> & { field: SelectFieldConfig<TValues> }) {
  const { field: controllerField, fieldState } = useController({
    control,
    name: field.name,
  });
  const value =
    typeof controllerField.value === "string" ? controllerField.value : "";

  return (
    <SelectField
      id={field.id ?? ""}
      label={field.label}
      value={value}
      onChange={(next) => controllerField.onChange(emptyValue(next, field, ""))}
      onBlur={controllerField.onBlur}
      options={field.options}
      description={field.description}
      required={field.required}
      isDisabled={field.isDisabled}
      className={field.className}
      data-testid={field.testId}
      error={errorMessage(fieldState.error, field.error, getErrorMessage)}
    />
  );
}

function ControlledDateField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues> & { field: DateFieldConfig<TValues> }) {
  const { field: controllerField, fieldState } = useController({
    control,
    name: field.name,
  });
  const value =
    typeof controllerField.value === "string" ? controllerField.value : "";

  return (
    <DatePickerField
      id={field.id ?? ""}
      label={field.label}
      value={value}
      onChange={(next) => controllerField.onChange(emptyValue(next, field, ""))}
      onBlur={controllerField.onBlur}
      minValue={field.minValue}
      maxValue={field.maxValue}
      description={field.description}
      required={field.required}
      isDisabled={field.isDisabled}
      className={field.className}
      data-testid={field.testId}
      error={errorMessage(fieldState.error, field.error, getErrorMessage)}
    />
  );
}

function ControlledDecimalField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues> & { field: DecimalFieldConfig<TValues> }) {
  const { field: controllerField, fieldState } = useController({
    control,
    name: field.name,
  });
  const value =
    typeof controllerField.value === "string" ? controllerField.value : "";

  return (
    <DecimalField
      id={field.id ?? ""}
      label={field.label}
      value={value}
      onValueChange={(next) =>
        controllerField.onChange(emptyValue(next, field, ""))
      }
      onBlur={controllerField.onBlur}
      placeholder={field.placeholder}
      description={field.description}
      required={field.required}
      disabled={field.isDisabled}
      className={field.className}
      data-testid={field.testId}
      error={errorMessage(fieldState.error, field.error, getErrorMessage)}
    />
  );
}

export function ControlledField<TValues extends FieldValues>({
  control,
  field,
  getErrorMessage,
}: ControlledFieldProps<TValues>) {
  const generatedId = useId();
  const resolvedField = { ...field, id: field.id ?? generatedId };

  switch (resolvedField.type) {
    case "number":
    case "percentage":
      return (
        <ControlledNumberField
          control={control}
          field={resolvedField}
          getErrorMessage={getErrorMessage}
        />
      );
    case "amount":
      return (
        <ControlledAmountField
          control={control}
          field={resolvedField}
          getErrorMessage={getErrorMessage}
        />
      );
    case "select":
      return (
        <ControlledSelectField
          control={control}
          field={resolvedField}
          getErrorMessage={getErrorMessage}
        />
      );
    case "date":
      return (
        <ControlledDateField
          control={control}
          field={resolvedField}
          getErrorMessage={getErrorMessage}
        />
      );
    case "decimal":
      return (
        <ControlledDecimalField
          control={control}
          field={resolvedField}
          getErrorMessage={getErrorMessage}
        />
      );
    default:
      return assertNever(resolvedField);
  }
}

export function ControlledFields<TValues extends FieldValues>({
  control,
  fields,
  getErrorMessage,
}: ControlledFieldsProps<TValues>) {
  return (
    <>
      {fields.map((field) => (
        <ControlledField
          key={field.name}
          control={control}
          field={field}
          getErrorMessage={getErrorMessage}
        />
      ))}
    </>
  );
}
