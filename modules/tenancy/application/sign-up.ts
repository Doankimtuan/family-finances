import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { registerInputSchema, type RegisterInput } from "./register.schema";

export type SignUpResult =
  | { ok: true; next: "home" | "confirm" }
  | {
      ok: false;
      code: "unconfigured" | "invalid" | "already_registered" | "unknown";
    };

/**
 * Create Auth account via email/password. Confirm path reuses /auth/confirm.
 */
export async function signUpWithPassword(
  raw: RegisterInput & { emailRedirectTo: string },
): Promise<SignUpResult> {
  const parsed = registerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: "unconfigured" };
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
        message.includes("already") ||
        message.includes("registered") ||
        error.code === "user_already_exists"
      ) {
        return { ok: false, code: "already_registered" };
      }
      return { ok: false, code: "invalid" };
    }

    if (data.session) {
      return { ok: true, next: "home" };
    }
    return { ok: true, next: "confirm" };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
