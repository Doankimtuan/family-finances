import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refresh the auth session on every matched request.
 * Uses getClaims() (not getSession()) per current Supabase SSR guidance.
 *
 * When `response` is provided (e.g. from next-intl middleware), auth cookies are
 * stamped onto that response — never replace it with a fresh `NextResponse.next()`,
 * or locale rewrites/redirects from next-intl are lost.
 *
 * Does not redirect unauthenticated users — auth gating is a later sprint.
 */
export async function updateSession(
  request: NextRequest,
  response?: NextResponse,
) {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return response ?? NextResponse.next({ request });
  }

  let supabaseResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Only allocate a new response when we are not composing with next-intl
        if (!response) {
          supabaseResponse = NextResponse.next({ request });
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        supabaseResponse.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  // Required for token refresh — do not remove or insert logic before this call.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
