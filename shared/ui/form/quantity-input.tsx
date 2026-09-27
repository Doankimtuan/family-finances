"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/shared/i18n/formatters";
import { NumberInput } from "./number-input";
import type { NumberInputProps } from "./number-input";

export type QuantityInputProps = Omit<
  NumberInputProps,
  "max" | "min" | "formatOptions" | "suffix"
> & {
  maxValue?: number;
  unitSuffix?: ReactNode;
  maxLabel?: string;
  decimals?: number;
};

/** Quantity entry over the shared number field, with an optional MAX action. */
export function QuantityInput({
  maxValue,
  unitSuffix,
  maxLabel,
  decimals = 4,
  value,
  onValueChange,
  isDisabled,
  isReadOnly,
  disabled,
  readOnly,
  ...props
}: QuantityInputProps) {
  const locale = useLocale();
  const t = useTranslations("forms.quantityInput");
  const isActionDisabled = Boolean(
    isDisabled || isReadOnly || disabled || readOnly,
  );
  const resolvedMaxLabel = maxLabel ?? t("max");

  const maxAction =
    maxValue !== undefined && !isActionDisabled ? (
      <button
        type="button"
        onClick={() => onValueChange(maxValue)}
        aria-label={t("maxValue", {
          label: resolvedMaxLabel,
          value: formatNumber(maxValue, locale),
        })}
        className="min-h-11 min-w-11 shrink-0 rounded-[var(--radius-sm)] bg-primary-soft px-(--space-2) text-xs font-semibold text-primary hover:bg-primary-soft/80 focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        {resolvedMaxLabel}
      </button>
    ) : null;

  return (
    <NumberInput
      {...props}
      value={value}
      onValueChange={onValueChange}
      min={0}
      max={maxValue}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      disabled={disabled}
      readOnly={readOnly}
      formatOptions={{ maximumFractionDigits: decimals }}
      suffix={unitSuffix}
      trailingAction={maxAction}
    />
  );
}
