import type { User } from "@supabase/supabase-js";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSessionUser } from "./get-session-user";
import {
  resolveActiveMembership,
  type ActiveMembership,
} from "./resolve-active-membership";
import { loginHrefWithNext, TOGETHER_PATH } from "./tenancy-constants";

export type TogetherMembershipGate = {
  locale: AppLocale;
  user: User;
  membership: ActiveMembership;
};

/**
 * Shared Together subpage gate: locale normalize → session → active membership.
 * Unauthenticated users return to login with `next` so post-sign-in resumes.
 */
export async function requireTogetherMembership(input: {
  localeParam: string;
  nextPath: string;
}): Promise<TogetherMembershipGate> {
  const locale: AppLocale = hasLocale(routing.locales, input.localeParam)
    ? input.localeParam
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({
      href: loginHrefWithNext(input.nextPath),
      locale,
    });
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: TOGETHER_PATH.ONBOARD, locale });
  }

  return { locale, user, membership };
}
