/**
 * Shared server action context resolution.
 *
 * Usage in any "use server" file:
 *   const { supabase, user, householdId, t, error } = await resolveActionContext();
 *   if (error || !user || !householdId) return fail(error ?? t("errors.household_not_found"));
 */
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME, type AppLanguage } from "@/lib/i18n/config";
import { t as translate } from "@/lib/i18n/dictionary";

export type ActionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: any; // Type simplification for context
  householdId: string | null;
  t: (key: string) => string;
  error: string | null;
};

/**
 * Resolves authentication, household context, and localization for a Server Action.
 */
export async function resolveActionContext(): Promise<ActionContext> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  
  const language = (cookieStore.get(LANGUAGE_COOKIE_NAME)?.value ?? "en") as AppLanguage;
  const t = (key: string) => translate(language, key);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      householdId: null,
      t,
      error: t("errors.unauthorized"),
    };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    return {
      supabase,
      user,
      householdId: null,
      t,
      error: (membership.error?.message ?? t("errors.household_not_found")) as string,
    };
  }

  return {
    supabase,
    user,
    householdId: membership.data.household_id as string,
    t,
    error: null,
  };
}

/**
 * Strict variant used in jars/intent-actions — throws instead of returning error.
 */
export async function resolveActionContextOrThrow() {
  const ctx = await resolveActionContext();
  if (ctx.error) {
    throw new Error(ctx.error);
  }
  return {
    supabase: ctx.supabase,
    user: ctx.user,
    householdId: ctx.householdId as string,
    t: ctx.t,
  };
}
