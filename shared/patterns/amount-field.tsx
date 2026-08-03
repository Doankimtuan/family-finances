"use client";

import { useLocale } from "next-intl";
import { TextField, type TextFieldProps } from "@/shared/ui/form";
import {
  formatAmountInput,
  parseAmountDigits,
} from "@/shared/i18n/amount-input";
import { cn } from "@/shared/utils/cn";

export type AmountFieldProps = Omit<
  TextFieldProps,
  "value" | "onChange" | "type" | "inputMode" | "defaultValue"
> & {
  /** Canonical whole-unit amount (VND đồng, etc.). `null` when empty. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** App locale (`en` | `vi`). Defaults to the active next-intl locale. */
  locale?: string;
};

/**
 * Form money / whole-number field with locale thousand separators
 * (e.g. `1.000.000` in `vi`, `1,000,000` in `en`).
 *
 * Stores an integer; displays a formatted string. Compose via TextField.
 */
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
  const display = value == null ? "" : formatAmountInput(value, locale);

  return (
    <TextField
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      className={cn("tabular-nums", className)}
      value={display}
      onChange={(event) => {
        onValueChange(parseAmountDigits(event.target.value));
      }}
    />
  );
}
