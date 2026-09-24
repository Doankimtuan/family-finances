import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseRouteHandlerClient } from "@/modules/platform/supabase/route-handler";
import { removeSignedOutReminderDevice } from "@/modules/ledger/application/daily-expense-reminder";
import {
  EXPENSE_REMINDER_COOKIE,
  EXPENSE_REMINDER_OPERATION,
} from "@/modules/ledger/application/expense-reminder-constants";
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
  const deviceSubscriptionId = request.cookies.get(
    EXPENSE_REMINDER_COOKIE.DEVICE_SUBSCRIPTION_ID,
  )?.value;

  if (!getSupabaseEnv().isConfigured) {
    return redirect;
  }

  try {
    const supabase = createSupabaseRouteHandlerClient(request, redirect);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && deviceSubscriptionId) {
      const removed = await removeSignedOutReminderDevice(
        user.id,
        deviceSubscriptionId,
      );
      if (removed) {
        redirect.cookies.set(
          EXPENSE_REMINDER_COOKIE.DEVICE_SUBSCRIPTION_ID,
          "",
          { path: "/", maxAge: 0 },
        );
      }
    }
    await supabase.auth.signOut();
  } catch (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.REMOVE_SUBSCRIPTION,
      error,
    });
  }

  return redirect;
}
