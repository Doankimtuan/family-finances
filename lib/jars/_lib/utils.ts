import { JarSuggestion } from "./types";

export function toMonthStart(dateValue: string | Date) {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(`${dateValue}T00:00:00.000Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function slugifyJarName(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function normalizeSuggestions(value: unknown): JarSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const jarId = String(row.jarId ?? row.jar_id ?? "");
      const jarName = String(row.jarName ?? row.jar_name ?? "");
      const amount = Math.round(Number(row.amount ?? 0));
      const reason = String(row.reason ?? "");
      if (!jarId || amount <= 0) return null;
      return { jarId, jarName, amount, reason };
    })
    .filter((item): item is JarSuggestion => Boolean(item));
}
