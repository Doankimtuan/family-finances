const DEFAULT_LOCALE = "en-US";

function resolveLocale(locale?: string) {
  return locale?.trim() || DEFAULT_LOCALE;
}

function isVietnamese(locale?: string) {
  return resolveLocale(locale).toLowerCase().startsWith("vi");
}

export function formatVnd(value: number | null | undefined, locale?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatVndCompact(value: number | null | undefined, locale?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const vi = isVietnamese(locale);

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}${vi ? " ty" : "B"}`;
  }

  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}${vi ? " tr" : "M"}`;
  }

  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }

  return `${sign}${new Intl.NumberFormat(resolveLocale(locale), { maximumFractionDigits: 0 }).format(Math.round(abs))}${vi ? " VND" : " VND"}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function formatMonths(value: number | null | undefined, locale?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)} ${isVietnamese(locale) ? "tháng" : "mo"}`;
}

export function compactMonth(dateValue: string, locale?: string): string {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function formatDate(dateValue: string | Date, locale?: string, options?: Intl.DateTimeFormatOptions) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(date);
}

export function formatDateTime(dateValue: string | Date, locale?: string, options?: Intl.DateTimeFormatOptions) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(date);
}

export function formatNumber(value: number | null | undefined, locale?: string, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat(resolveLocale(locale), options).format(value);
}
