import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/**
 * Server Supabase client factory.
 * Fail-closed: throws if env is missing or placeholder.
 * Cookie writes from Server Components may no-op; proxy refreshes sessions.
 */
export async function createSupabaseServerClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe when proxy refreshes sessions.
        }
      },
    },
  });
}
