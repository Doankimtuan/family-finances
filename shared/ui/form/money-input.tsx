"use client";

import { I18nProvider } from "@heroui/react";
import { useLocale } from "next-intl";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { toIntlLocale } from "@/i18n/locales";
import { NumberField, type NumberFieldProps } from "./number-field";

export type MoneyInputProps = Omit<
  NumberFieldProps,
  "value" | "defaultValue" | "onChange" | "onBlur" | "minValue"
> & {
  /** Canonical major-unit numeric value; `null` is intentionally empty. */
  value: number | null;
  /** Receives only an unformatted numeric value or the explicit empty state. */
  onValueChange: (value: number | null) => void;
  currency?: string;
  locale?: string;
  fractionDigits?: number;
  minValue?: number;
};

/**
 * Localized currency field backed by HeroUI NumberField.
 * Controlled numeric contract — integrate with RHF via `Controller`, never via
 * `register` (formatted display strings must not enter form state).
 * Display formatting never crosses the persistence boundary.
 */
export function MoneyInput({
  value,
  onValueChange,
  currency = DEFAULT_CURRENCY,
  locale: localeProp,
  fractionDigits,
  minValue,
  ...props
}: MoneyInputProps) {
  const activeLocale = useLocale();
  const locale = toIntlLocale(localeProp ?? activeLocale);
  const resolvedFractionDigits =
    fractionDigits ?? (currency === DEFAULT_CURRENCY ? 0 : undefined);
  const resolvedMinValue = minValue ?? 0;

  return (
    <I18nProvider locale={locale}>
      <NumberField
        {...props}
        value={value ?? undefined}
        minValue={resolvedMinValue}
        formatOptions={{
          style: "currency",
          currency,
          currencyDisplay: "symbol",
          maximumFractionDigits: resolvedFractionDigits,
        }}
        onChange={(next) => onValueChange(Number.isFinite(next) ? next : null)}
      />
    </I18nProvider>
  );
}
