"use client";

import {
  NumberField,
  type NumberFieldProps,
} from "@/shared/ui/form/number-field";

export type PercentageFieldProps = Omit<
  NumberFieldProps,
  "minValue" | "maxValue" | "step"
> & {
  minValue?: number;
  maxValue?: number;
  step?: number;
};

/** Numeric percentage entry. Values are stored as percentage points, e.g. 5 = 5%. */
export function PercentageField({
  minValue = 0,
  maxValue = 100,
  step = 0.01,
  ...props
}: PercentageFieldProps) {
  return (
    <NumberField
      {...props}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
    />
  );
}
