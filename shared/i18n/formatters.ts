import { toIntlLocale } from "@/i18n/locales";

type FormatLocale = string;

function resolveLocale(locale?: FormatLocale) {
  return toIntlLocale(locale ?? "en");
}

const DATE_COMPONENT_OPTION_KEYS = [
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "timeZoneName",
] as const;

function hasExplicitDateComponents(options?: Intl.DateTimeFormatOptions) {
  return DATE_COMPONENT_OPTION_KEYS.some((key) => options?.[key] !== undefined);
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

/**
 * Default to a medium date, while allowing explicit date parts for compact
 * chart ticks and other component-level views without an Intl style conflict.
 */
export function formatDate(
  value: Date | number,
  locale?: FormatLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  const formatOptions: Intl.DateTimeFormatOptions = hasExplicitDateComponents(
    options,
  )
    ? (options ?? {})
    : { dateStyle: "medium", ...(options ?? {}) };
  return new Intl.DateTimeFormat(resolveLocale(locale), formatOptions).format(
    value,
  );
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
