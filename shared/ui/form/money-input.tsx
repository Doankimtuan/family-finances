"use client";

import { I18nProvider } from "@heroui/react";
import { useLocale } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";
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
  /** Set a negative minValue to allow signed monetary entries. */
  registration?: UseFormRegisterReturn;
};
/**
 * Localized currency field backed by HeroUI NumberField.
 * Display formatting never crosses the persistence boundary.
 */
export function MoneyInput({
  value,
  onValueChange,
  currency = DEFAULT_CURRENCY,
  locale: localeProp,
  fractionDigits,
  minValue,
  registration,
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
        name={registration?.name}
        value={value ?? undefined}
        minValue={resolvedMinValue}
        formatOptions={{
          style: "currency",
          currency,
          currencyDisplay: "symbol",
          maximumFractionDigits: resolvedFractionDigits,
        }}
        onChange={(next) => {
          const normalized = Number.isFinite(next) ? next : null;
          onValueChange(normalized);
          registration?.onChange({
            target: {
              name: registration.name,
              value: normalized == null ? "" : String(normalized),
            },
          });
        }}
        onBlur={() =>
          registration?.onBlur({ target: { name: registration.name } })
        }
      />
    </I18nProvider>
  );
}
