import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ERROR_MESSAGE_NEEDLE,
  AUTH_SIGN_UP_NEXT,
  SUPABASE_AUTH_ERROR_CODE,
  type AuthActionErrorCode,
  type AuthSignUpNext,
} from "./auth-constants";
import { registerInputSchema, type RegisterInput } from "./register.schema";

export type SignUpErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID
  | typeof AUTH_ACTION_ERROR_CODE.ALREADY_REGISTERED
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

export type SignUpResult =
  { ok: true; next: AuthSignUpNext } | { ok: false; code: SignUpErrorCode };

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
      const message = error.message.toLowerCase();
      if (
        message.includes(AUTH_ERROR_MESSAGE_NEEDLE.ALREADY) ||
        message.includes(AUTH_ERROR_MESSAGE_NEEDLE.REGISTERED) ||
        error.code === SUPABASE_AUTH_ERROR_CODE.USER_ALREADY_EXISTS
      ) {
        return { ok: false, code: AUTH_ACTION_ERROR_CODE.ALREADY_REGISTERED };
      }
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
    }

    if (data.session) {
      // New accounts have no household yet → onboard (AC-014).
      return { ok: true, next: AUTH_SIGN_UP_NEXT.ONBOARD };
    }
    return { ok: true, next: AUTH_SIGN_UP_NEXT.CONFIRM };
  } catch {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
