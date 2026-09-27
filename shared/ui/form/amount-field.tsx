"use client";

import { useLocale } from "next-intl";
import {
  formatAmountInput,
  parseAmountDigits,
} from "@/shared/i18n/amount-input";
import { cn } from "@/shared/utils/cn";
import { TextField, type TextFieldProps } from "./text-field";

export type AmountFieldProps = Omit<
  TextFieldProps,
  "value" | "onChange" | "type" | "inputMode" | "defaultValue"
> & {
  /** Canonical whole-unit amount. `null` represents an empty field. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  locale?: string;
};

/** Locale-formatted integer amount input; only the numeric value is reported. */
export function AmountField({
  value,
  onValueChange,
  locale: localeProp,
  className,
  autoComplete = "off",
  ...props
}: AmountFieldProps) {
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;

  return (
    <TextField
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      className={cn("tabular-nums", className)}
      value={value == null ? "" : formatAmountInput(value, locale)}
      onChange={(event) => onValueChange(parseAmountDigits(event.target.value))}
    />
  );
}
