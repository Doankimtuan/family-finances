import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseRouteHandlerClient } from "@/modules/platform/supabase/route-handler";
import { routing, locales, type AppLocale } from "@/i18n/routing";
import { isTrustedSameOriginMutation } from "@/modules/tenancy/application/assert-same-origin-mutation";
import {
  HTTP_STATUS,
  LOCALE_COOKIE_NAME,
  localeLoginPath,
} from "@/modules/tenancy/application/auth-constants";

function resolveLocale(request: NextRequest): AppLocale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null;
  if (fromCookie && (locales as readonly string[]).includes(fromCookie)) {
    return fromCookie as AppLocale;
  }
  return routing.defaultLocale;
}

function loginRedirect(origin: string, locale: string): string {
  return `${origin}${localeLoginPath(locale)}`;
}

/**
 * Auth sign-out adapter (Architecture: app/auth).
 * POST-only with same-origin CSRF gate. Clears SSR session cookies → Login.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) {
    return new NextResponse(null, { status: HTTP_STATUS.FORBIDDEN });
  }

  const { origin } = new URL(request.url);
  const locale = resolveLocale(request);
  const redirect = NextResponse.redirect(loginRedirect(origin, locale), {
    status: HTTP_STATUS.SEE_OTHER,
  });

  if (!getSupabaseEnv().isConfigured) {
    return redirect;
  }

  try {
    const supabase = createSupabaseRouteHandlerClient(request, redirect);
    await supabase.auth.signOut();
  } catch {
    /* still leave auth surface */
  }

  return redirect;
}
