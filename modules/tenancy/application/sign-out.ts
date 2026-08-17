import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { AUTH_ACTION_ERROR_CODE } from "./auth-constants";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type SignOutResult = Result<
  object,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

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
      logTenancyFailure(TENANCY_OPERATION.AUTH_SIGN_OUT, error);
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_SIGN_OUT, error);
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
