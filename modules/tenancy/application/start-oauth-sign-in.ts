import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { startOAuthInputSchema, type StartOAuthInput } from "./oauth.schema";

export type StartOAuthResult =
  | { ok: true; url: string }
  | {
      ok: false;
      code: "unconfigured" | "invalid" | "provider_error" | "unknown";
    };

/**
 * Start Supabase OAuth (Google / Apple) with PKCE.
 * Returns the IdP URL for the browser to navigate; callback reuses /auth/confirm.
 */
export async function startOAuthSignIn(
  raw: StartOAuthInput,
): Promise<StartOAuthResult> {
  const parsed = startOAuthInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: "unconfigured" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsed.data.provider,
      options: {
        redirectTo: parsed.data.redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { ok: false, code: "provider_error" };
    }

    return { ok: true, url: data.url };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
