import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { routing } from "@/i18n/routing";

function localeHomePath(locale: string, next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    if (
      routing.locales.some((l) => next === `/${l}` || next.startsWith(`/${l}/`))
    ) {
      return next;
    }
    return `/${locale}${next}`;
  }
  return `/${locale}/home`;
}

/**
 * Auth confirm adapter (Architecture: app/auth).
 * Exchanges OAuth PKCE `code` or email OTP `token_hash`, then redirects into locale routes.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const locale = routing.defaultLocale;

  const confirmUi = `${origin}/${locale}/auth/confirm`;

  if (!getSupabaseEnv().isConfigured) {
    return NextResponse.redirect(`${confirmUi}?status=error&code=unconfigured`);
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(
          `${origin}${localeHomePath(locale, next)}`,
        );
      }
      return NextResponse.redirect(`${confirmUi}?status=error&code=invalid`);
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as "email" | "signup" | "invite" | "magiclink" | "recovery",
        token_hash: tokenHash,
      });
      if (!error) {
        return NextResponse.redirect(
          `${origin}${localeHomePath(locale, next)}`,
        );
      }
      return NextResponse.redirect(`${confirmUi}?status=error&code=invalid`);
    }
  } catch {
    return NextResponse.redirect(`${confirmUi}?status=error&code=unknown`);
  }

  return NextResponse.redirect(`${confirmUi}?status=error&code=invalid`);
}
