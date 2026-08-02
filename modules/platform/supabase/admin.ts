import { createClient } from "@supabase/supabase-js";
import "server-only";
import { getSupabaseEnv } from "./env";

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
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
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
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server only.",
    );
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
