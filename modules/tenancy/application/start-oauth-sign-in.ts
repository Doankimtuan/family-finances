import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { startOAuthInputSchema, type StartOAuthInput } from "./oauth.schema";
import { AUTH_ACTION_ERROR_CODE } from "./auth-constants";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type StartOAuthResult =
  | { ok: true; url: string }
  | {
      ok: false;
      code:
        | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
        | typeof AUTH_ACTION_ERROR_CODE.INVALID
        | typeof AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR
        | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN;
    };

/**
 * Server-side OAuth start (legacy). Prefer `startBrowserOAuthSignIn` so the
 * PKCE verifier is stored in the browser cookie jar used by `/auth/confirm`.
 */
export async function startOAuthSignIn(
  raw: StartOAuthInput,
): Promise<StartOAuthResult> {
  const parsed = startOAuthInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
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
      if (error) logTenancyFailure(TENANCY_OPERATION.AUTH_OAUTH, error);
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR };
    }

    return { ok: true, url: data.url };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_OAUTH, error);
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
