import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Current Auth user, or null when unconfigured / signed out / error. */
export async function getSessionUser(): Promise<User | null> {
  if (!getSupabaseEnv().isConfigured) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
