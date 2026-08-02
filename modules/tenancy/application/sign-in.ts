import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { signInInputSchema, type SignInInput } from "./sign-in.schema";

export { signInInputSchema, type SignInInput } from "./sign-in.schema";

export type SignInResult =
  | { ok: true }
  | { ok: false; code: "unconfigured" | "invalid_credentials" | "unknown" };

/**
 * Establish Supabase Auth session via email/password (SSR cookie client).
 */
export async function signInWithPassword(
  raw: SignInInput,
): Promise<SignInResult> {
  const parsed = signInInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid_credentials" };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: "unconfigured" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return { ok: false, code: "invalid_credentials" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
