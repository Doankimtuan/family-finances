"use client";

import { useLocale } from "next-intl";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
} from "./formatters";

/** Client hook — formatters bound to the active next-intl locale */
export function useAppFormatter() {
  const locale = useLocale();

  return {
    currency: (
      amount: number,
      currencyCode: string,
      options?: Intl.NumberFormatOptions,
    ) => formatCurrency(amount, currencyCode, locale, options),
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),
    percent: (value: number, options?: Intl.NumberFormatOptions) =>
      formatPercent(value, locale, options),
    date: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(value, locale, options),
    time: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
      formatTime(value, locale, options),
    relativeTime: (
      value: number,
      unit: Intl.RelativeTimeFormatUnit,
      options?: Intl.RelativeTimeFormatOptions,
    ) => formatRelativeTime(value, unit, locale, options),
  };
}
