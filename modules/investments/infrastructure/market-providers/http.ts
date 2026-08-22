const PROVIDER_REQUEST_TIMEOUT_MS = 20_000;

export async function fetchProviderJson(
  input: string,
  init: RequestInit = {},
): Promise<unknown> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Provider request timed out")),
          PROVIDER_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
    if (!response.ok) {
      throw new Error(`Provider request failed with status ${response.status}`);
    }
    return response.json();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function readNumber(
  record: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }
  return null;
}

export function readBoolean(
  record: Record<string, unknown>,
  ...keys: string[]
): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

export function readRows(value: unknown, key = "data"): readonly unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  const rows = value[key];
  if (Array.isArray(rows)) return rows;
  return [];
}

export function providerDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 10_000_000_000 ? value * 1_000 : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString().slice(0, 10);
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function providerMetadata(
  entries: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined),
  );
}
