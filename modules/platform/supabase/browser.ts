import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

/**
 * Browser Supabase client factory.
 * Fail-closed: throws if env is missing or placeholder.
 */
export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key);
}
