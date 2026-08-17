import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  createSupabaseAdminClient,
  getSupabaseServiceRoleEnv,
} from "@/modules/platform/supabase/admin";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { AUTH_ACTION_ERROR_CODE } from "./auth-constants";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type DeleteAccountResult = Result<
  object,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

/**
 * Permanently delete the authenticated Auth user via Admin API (service role).
 * Always runs server-side; never expose the service role to the client.
 * Clears the local session after a successful delete.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  if (!getSupabaseServiceRoleEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const user = await getSessionUser();
    if (!user) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED };
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error, {
        userId: user.id,
      });
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
    }

    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (error) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SIGN_OUT, error, {
        userId: user.id,
      });
    }

    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
