import type { User } from "@supabase/supabase-js";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSessionMembership } from "./get-session-membership";
import type { ActiveMembership } from "./resolve-active-membership";
import { APP_PATH, loginHrefWithNext } from "./tenancy-constants";

export type ProductSessionGate = {
  locale: AppLocale;
  user: User;
  membership: ActiveMembership;
};

/**
 * Canonical product-route gate: locale normalize → session → active membership.
 * Unauthenticated users go to login; users without a household go to onboard.
 * Pass `nextPath` only when a post-login resume path already exists (Together).
 */
export async function requireProductSession(input: {
  localeParam: string;
  nextPath?: string;
}): Promise<ProductSessionGate> {
  const locale: AppLocale = hasLocale(routing.locales, input.localeParam)
    ? input.localeParam
    : routing.defaultLocale;
  setLocale(locale);

  const { user, membership } = await getSessionMembership();
  if (!user) {
    return redirect({
      href: input.nextPath ? loginHrefWithNext(input.nextPath) : APP_PATH.LOGIN,
      locale,
    });
  }

  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  return { locale, user, membership };
}
