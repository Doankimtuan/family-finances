import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseRouteHandlerClient } from "@/modules/platform/supabase/route-handler";
import { routing, locales, type AppLocale } from "@/i18n/routing";
import {
  mapAuthLinkingError,
  mapOAuthCallbackQuery,
} from "@/modules/tenancy/application/map-auth-linking-error";
import { isSafeInAppNextPath } from "@/modules/tenancy/application/auth-redirect";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_QUERY,
  AUTH_CONFIRM_STATUS,
  LOCALE_COOKIE_NAME,
  OTP_VERIFY_TYPES,
  localeConfirmPath,
  localeHomePath,
  localeOnboardPath,
  type OtpVerifyType,
} from "@/modules/tenancy/application/auth-constants";

function resolveConfirmLocale(request: NextRequest): AppLocale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null;
  if (fromCookie && (locales as readonly string[]).includes(fromCookie)) {
    return fromCookie as AppLocale;
  }
  return routing.defaultLocale;
}

function resolveExplicitNextPath(
  locale: string,
  next: string | null,
): string | null {
  if (!next || !isSafeInAppNextPath(next)) {
    return null;
  }
  if (
    routing.locales.some((l) => next === `/${l}` || next.startsWith(`/${l}/`))
  ) {
    return next;
  }
  return `/${locale}${next}`;
}

async function resolveDefaultPostAuthPath(
  supabase: SupabaseClient,
  locale: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return localeHomePath(locale);
  }
  const membership = await resolveActiveMembership(user.id, supabase);
  return membership ? localeHomePath(locale) : localeOnboardPath(locale);
}

function confirmErrorUrl(origin: string, locale: string, code: string): string {
  const qs = new URLSearchParams({
    [AUTH_CONFIRM_QUERY.STATUS]: AUTH_CONFIRM_STATUS.ERROR,
    [AUTH_CONFIRM_QUERY.CODE]: code,
  });
  return `${origin}${localeConfirmPath(locale)}?${qs.toString()}`;
}

/**
 * Auth confirm adapter (Architecture: app/auth).
 * Exchanges OAuth PKCE `code` or email OTP `token_hash`, then redirects into locale routes.
 *
 * Important: this path must stay outside next-intl locale rewriting (see `proxy.ts`).
 * Cookie writes must land on the redirect `NextResponse` (see route-handler client).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get(AUTH_CONFIRM_QUERY.CODE);
  const tokenHash = searchParams.get(AUTH_CONFIRM_QUERY.TOKEN_HASH);
  const type = searchParams.get(AUTH_CONFIRM_QUERY.TYPE);
  const next = searchParams.get(AUTH_CONFIRM_QUERY.NEXT);
  const oauthError = searchParams.get(AUTH_CONFIRM_QUERY.ERROR);
  const oauthErrorDescription = searchParams.get(
    AUTH_CONFIRM_QUERY.ERROR_DESCRIPTION,
  );
  const locale = resolveConfirmLocale(request);

  if (!getSupabaseEnv().isConfigured) {
    return NextResponse.redirect(
      confirmErrorUrl(origin, locale, AUTH_CONFIRM_ERROR_CODE.UNCONFIGURED),
    );
  }

  if (oauthError || oauthErrorDescription) {
    const mapped = mapOAuthCallbackQuery({
      error: oauthError,
      errorDescription: oauthErrorDescription,
    });
    return NextResponse.redirect(confirmErrorUrl(origin, locale, mapped));
  }

  try {
    if (code) {
      // Location rewritten after exchange; cookies must stay on this response.
      const successRedirect = NextResponse.redirect(
        `${origin}${localeHomePath(locale)}`,
      );
      const supabase = createSupabaseRouteHandlerClient(
        request,
        successRedirect,
      );
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const dest =
          resolveExplicitNextPath(locale, next) ??
          (await resolveDefaultPostAuthPath(supabase, locale));
        successRedirect.headers.set("Location", `${origin}${dest}`);
        return successRedirect;
      }
      const mapped = mapAuthLinkingError(error);
      return NextResponse.redirect(confirmErrorUrl(origin, locale, mapped));
    }

    if (tokenHash && type && OTP_VERIFY_TYPES.has(type)) {
      const successRedirect = NextResponse.redirect(
        `${origin}${localeHomePath(locale)}`,
      );
      const supabase = createSupabaseRouteHandlerClient(
        request,
        successRedirect,
      );
      const { error } = await supabase.auth.verifyOtp({
        type: type as OtpVerifyType,
        token_hash: tokenHash,
      });
      if (!error) {
        const dest =
          resolveExplicitNextPath(locale, next) ??
          (await resolveDefaultPostAuthPath(supabase, locale));
        successRedirect.headers.set("Location", `${origin}${dest}`);
        return successRedirect;
      }
      return NextResponse.redirect(
        confirmErrorUrl(origin, locale, AUTH_CONFIRM_ERROR_CODE.INVALID),
      );
    }
  } catch {
    return NextResponse.redirect(
      confirmErrorUrl(origin, locale, AUTH_CONFIRM_ERROR_CODE.UNKNOWN),
    );
  }

  return NextResponse.redirect(
    confirmErrorUrl(origin, locale, AUTH_CONFIRM_ERROR_CODE.INVALID),
  );
}
