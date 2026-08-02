import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";

export type AuthEntryDestination = "welcome" | "home";

/**
 * Resolve post-splash destination from Auth session.
 * Unconfigured Supabase or errors → welcome (signed-out path).
 * Onboard wizard is S2 — authenticated users go to home.
 */
export async function resolveAuthEntry(): Promise<AuthEntryDestination> {
  if (!getSupabaseEnv().isConfigured) {
    return "welcome";
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? "home" : "welcome";
  } catch {
    return "welcome";
  }
}
