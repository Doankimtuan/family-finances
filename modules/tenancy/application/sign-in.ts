import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  AUTH_ACTION_ERROR_CODE,
  type AuthActionErrorCode,
} from "./auth-constants";
import { signInInputSchema, type SignInInput } from "./sign-in.schema";

export { signInInputSchema, type SignInInput } from "./sign-in.schema";

export type SignInErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

export type SignInResult = { ok: true } | { ok: false; code: SignInErrorCode };

/**
 * Establish Supabase Auth session via email/password (SSR cookie client).
 */
export async function signInWithPassword(
  raw: SignInInput,
): Promise<SignInResult> {
  const parsed = signInInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
