import { createClient } from "@supabase/supabase-js";
import "server-only";
import {
  getSupabaseEnv,
  SUPABASE_PLATFORM_ERROR_CODE,
  SupabaseConfigurationError,
} from "./env";

/**
 * Privileged Auth admin client — service role only, server-only.
 * Never import from client components.
 */
export function getSupabaseServiceRoleEnv(): {
  url: string;
  serviceRoleKey: string;
  isConfigured: boolean;
} {
  const { url, isConfigured: pubConfigured } = getSupabaseEnv();
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  const legacyKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const serviceRoleKey = secretKey || legacyKey;
  const isConfigured =
    pubConfigured &&
    Boolean(serviceRoleKey) &&
    !serviceRoleKey.toLowerCase().startsWith("your-");

  return {
    url: isConfigured ? url : "",
    serviceRoleKey: isConfigured ? serviceRoleKey : "",
    isConfigured,
  };
}

export function createSupabaseAdminClient() {
  const env = getSupabaseServiceRoleEnv();
  if (!env.isConfigured) {
    throw new SupabaseConfigurationError(
      SUPABASE_PLATFORM_ERROR_CODE.SERVICE_ROLE_UNCONFIGURED,
      "Supabase privileged key is not configured. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY on the server only.",
    );
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
