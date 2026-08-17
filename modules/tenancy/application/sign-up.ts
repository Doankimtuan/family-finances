import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_SIGN_UP_NEXT,
  type AuthActionErrorCode,
  type AuthSignUpNext,
} from "./auth-constants";
import { registerInputSchema, type RegisterInput } from "./register.schema";
import { classifySignUpError, logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type SignUpErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID
  | typeof AUTH_ACTION_ERROR_CODE.ALREADY_REGISTERED
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

export type SignUpResult = Result<{ next: AuthSignUpNext }, SignUpErrorCode>;

/**
 * Create Auth account via email/password. Confirm path reuses /auth/confirm.
 */
export async function signUpWithPassword(
  raw: RegisterInput & { emailRedirectTo: string },
): Promise<SignUpResult> {
  const parsed = registerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: raw.emailRedirectTo,
      },
    });

    if (error) {
      return { ok: false, code: classifySignUpError(error) };
    }

    if (data.session) {
      // New accounts have no household yet → onboard (AC-014).
      return { ok: true, next: AUTH_SIGN_UP_NEXT.ONBOARD };
    }
    return { ok: true, next: AUTH_SIGN_UP_NEXT.CONFIRM };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_SIGN_UP, error);
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
