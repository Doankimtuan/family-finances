"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { NumberInput } from "./number-input";
import type { NumberInputProps } from "./number-input";

export type PercentageInputProps = Omit<
  NumberInputProps,
  "min" | "max" | "step" | "formatOptions" | "suffix"
> & {
  min?: number;
  max?: number;
  step?: number;
  suffix?: ReactNode;
};

/** Percentage points entered through the shared numeric field. */
export function PercentageInput({
  min = 0,
  max = 100,
  step = 0.1,
  suffix,
  ...props
}: PercentageInputProps) {
  const t = useTranslations("forms.percentageInput");

  return (
    <NumberInput
      {...props}
      min={min}
      max={max}
      step={step}
      formatOptions={{ maximumFractionDigits: 2 }}
      suffix={suffix ?? t("suffix")}
    />
  );
}
