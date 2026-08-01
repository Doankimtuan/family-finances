import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refresh the auth session on every matched request.
 * Uses getClaims() (not getSession()) per current Supabase SSR guidance.
 *
 * Does not redirect unauthenticated users — auth gating is a later sprint.
 */
export async function updateSession(request: NextRequest) {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        // Prevent CDNs from caching authenticated responses
        supabaseResponse.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  // Required for token refresh — do not remove or insert logic before this call.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
