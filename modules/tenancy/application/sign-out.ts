import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { AUTH_ACTION_ERROR_CODE } from "./auth-constants";

export type SignOutResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
        | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN;
    };

/**
 * Clear the current Auth session (SSR cookies via server client).
 * Global sign-out for web MVP — no guest fallback.
 */
export async function signOut(): Promise<SignOutResult> {
  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
