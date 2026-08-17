/**
 * Public Supabase env for client factories.
 * Fail-closed: placeholders and invalid URLs are treated as unconfigured.
 */

const PLACEHOLDER_VALUES = new Set([
  "",
  "your-project-url",
  "your-publishable-key",
  "your-anon-key",
  "your-project-url/",
]);

export const SUPABASE_PLATFORM_ERROR_CODE = {
  UNCONFIGURED: "supabase_unconfigured",
  SERVICE_ROLE_UNCONFIGURED: "supabase_service_role_unconfigured",
} as const;

export type SupabasePlatformErrorCode =
  (typeof SUPABASE_PLATFORM_ERROR_CODE)[keyof typeof SUPABASE_PLATFORM_ERROR_CODE];

export class SupabaseConfigurationError extends Error {
  readonly code: SupabasePlatformErrorCode;

  constructor(code: SupabasePlatformErrorCode, message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
    this.code = code;
  }
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (PLACEHOLDER_VALUES.has(normalized)) return true;
  if (normalized.startsWith("your-")) return true;
  return false;
}

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export type SupabaseEnv = {
  url: string;
  key: string;
  isConfigured: boolean;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  const isConfigured =
    Boolean(url && key) &&
    !isPlaceholder(url) &&
    !isPlaceholder(key) &&
    isValidSupabaseUrl(url);

  return {
    url: isConfigured ? url : "",
    key: isConfigured ? key : "",
    isConfigured,
  };
}

/** Throws when env is missing or placeholder — use for factories that must not soft-fail. */
export function requireSupabaseEnv(): { url: string; key: string } {
  const env = getSupabaseEnv();
  if (!env.isConfigured) {
    throw new SupabaseConfigurationError(
      SUPABASE_PLATFORM_ERROR_CODE.UNCONFIGURED,
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to real values.",
    );
  }
  return { url: env.url, key: env.key };
}
