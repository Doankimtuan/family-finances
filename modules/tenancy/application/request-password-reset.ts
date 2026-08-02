import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  AUTH_ACTION_ERROR_CODE,
  type AuthActionErrorCode,
} from "./auth-constants";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "./register.schema";

export type ResetPasswordErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

export type ResetPasswordResult =
  { ok: true } | { ok: false; code: ResetPasswordErrorCode };

/**
 * Send password recovery email. Confirm/recovery links reuse /auth/confirm.
 */
export async function requestPasswordReset(
  raw: ForgotPasswordInput & { redirectTo: string },
): Promise<ResetPasswordResult> {
  const parsed = forgotPasswordInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: raw.redirectTo },
    );
    if (error) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
