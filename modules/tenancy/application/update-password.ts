import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { getSessionUser } from "./get-session-user";
import {
  AUTH_ACTION_ERROR_CODE,
  type AuthActionErrorCode,
} from "./auth-constants";
import {
  updatePasswordInputSchema,
  type UpdatePasswordInput,
} from "./update-password.schema";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type UpdatePasswordErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

export type UpdatePasswordResult = Result<object, UpdatePasswordErrorCode>;

export async function updatePassword(
  raw: UpdatePasswordInput,
): Promise<UpdatePasswordResult> {
  const parsed = updatePasswordInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_PASSWORD_UPDATE, error, {
        userId: user.id,
      });
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_PASSWORD_UPDATE, error, {
      userId: user.id,
    });
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
