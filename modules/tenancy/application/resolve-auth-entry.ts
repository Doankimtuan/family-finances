import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { resolveActiveMembership } from "./resolve-active-membership";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type AuthEntryDestination = "welcome" | "onboard" | "home";

/**
 * Resolve post-splash destination from Auth session + membership (S2).
 * Unconfigured / errors → welcome.
 * Authenticated without household → onboard.
 * Authenticated with active membership → home.
 */
export async function resolveAuthEntry(): Promise<AuthEntryDestination> {
  if (!getSupabaseEnv().isConfigured) {
    return "welcome";
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
      return "welcome";
    }
    if (!user) {
      return "welcome";
    }

    const membership = await resolveActiveMembership(user.id);
    return membership ? "home" : "onboard";
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    return "welcome";
  }
}
