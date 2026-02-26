const DEFAULT_LOCALE = "en-US";

export function formatVnd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function formatMonths(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)} mo`;
}

export function compactMonth(dateValue: string): string {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "short",
    year: "2-digit",
  }).format(date);
}
