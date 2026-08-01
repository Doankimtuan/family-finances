import { toIntlLocale } from "@/i18n/locales";

type FormatLocale = string;

function resolveLocale(locale?: FormatLocale) {
  return toIntlLocale(locale ?? "en");
}

/** Locale-aware currency (minor units as major number — callers pass major units). */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale?: FormatLocale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency: currencyCode,
    ...options,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale?: FormatLocale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(resolveLocale(locale), options).format(value);
}

export function formatPercent(
  value: number,
  locale?: FormatLocale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "percent",
    ...options,
  }).format(value);
}

export function formatDate(
  value: Date | number,
  locale?: FormatLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    ...options,
  }).format(value);
}

export function formatTime(
  value: Date | number,
  locale?: FormatLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    timeStyle: "short",
    ...options,
  }).format(value);
}

export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale?: FormatLocale,
  options?: Intl.RelativeTimeFormatOptions,
) {
  return new Intl.RelativeTimeFormat(resolveLocale(locale), {
    numeric: "auto",
    ...options,
  }).format(value, unit);
}
