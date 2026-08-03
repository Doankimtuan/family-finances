import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/modules/platform/supabase/update-session";
import {
  AUTH_ADAPTER_CONFIRM_PATH,
  AUTH_CONFIRM_QUERY,
  isAuthAdapterPath,
} from "@/modules/tenancy/application/auth-constants";
import { shouldRedirectToMaintenance } from "@/modules/platform/application/maintenance-mode";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const handleI18nRouting = createMiddleware(routing);

/**
 * Next.js 16 proxy — locale routing (next-intl) then Supabase session refresh.
 *
 * `/auth/*` adapters (e.g. `/auth/confirm` PKCE exchange) must NOT be
 * locale-prefixed. next-intl would otherwise rewrite `/auth/confirm?code=…`
 * to `/{locale}/auth/confirm?code=…`, which only renders a pending spinner
 * and never exchanges the code.
 *
 * Skip session refresh on the confirm callback itself — the route handler
 * owns `exchangeCodeForSession` / OTP verify and must stamp cookies onto
 * its redirect response without middleware interference.
 *
 * Maintenance mode (ST-E08-001) redirects product surfaces to `/maintenance`.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isAuthAdapterPath(pathname)) {
    const isConfirmExchange =
      pathname === AUTH_ADAPTER_CONFIRM_PATH &&
      (searchParams.has(AUTH_CONFIRM_QUERY.CODE) ||
        searchParams.has(AUTH_CONFIRM_QUERY.TOKEN_HASH) ||
        searchParams.has(AUTH_CONFIRM_QUERY.ERROR));
    if (isConfirmExchange) {
      return NextResponse.next({ request });
    }
    return updateSession(request);
  }

  if (shouldRedirectToMaintenance(pathname)) {
    const parts = pathname.split("/").filter(Boolean);
    const locale = parts[0] ?? routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${APP_PATH.MAINTENANCE}`;
    return NextResponse.redirect(url);
  }

  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
