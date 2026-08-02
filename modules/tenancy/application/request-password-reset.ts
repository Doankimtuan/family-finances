import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "./register.schema";

export type ResetPasswordResult =
  { ok: true } | { ok: false; code: "unconfigured" | "invalid" | "unknown" };

/**
 * Send password recovery email. Confirm/recovery links reuse /auth/confirm.
 */
export async function requestPasswordReset(
  raw: ForgotPasswordInput & { redirectTo: string },
): Promise<ResetPasswordResult> {
  const parsed = forgotPasswordInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: "unconfigured" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: raw.redirectTo },
    );
    if (error) {
      return { ok: false, code: "unknown" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
