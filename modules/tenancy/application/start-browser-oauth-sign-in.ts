import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseBrowserClient } from "@/modules/platform/supabase/browser";
import {
  startOAuthInputSchema,
  type OAuthProvider,
  type StartOAuthInput,
} from "@/modules/tenancy/application/oauth.schema";
import { isAllowedAuthConfirmRedirectTo } from "./auth-redirect";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ADAPTER_CONFIRM_PATH,
} from "./auth-constants";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type StartBrowserOAuthResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
        | typeof AUTH_ACTION_ERROR_CODE.INVALID
        | typeof AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR
        | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN;
    };

/**
 * Start Google/Apple OAuth from the browser so the PKCE code verifier is stored
 * in cookies the confirm route can read (same browser, same device).
 *
 * Prefer this over a Server Action `signInWithOAuth` + `window.location.assign`:
 * server-set verifier cookies are a common cause of failed `exchangeCodeForSession`.
 */
export async function startBrowserOAuthSignIn(
  raw: StartOAuthInput,
): Promise<StartBrowserOAuthResult> {
  const parsed = startOAuthInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (
    !isAllowedAuthConfirmRedirectTo(
      parsed.data.redirectTo,
      window.location.origin,
    )
  ) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsed.data.provider,
      options: {
        redirectTo: parsed.data.redirectTo,
      },
    });

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_OAUTH, error);
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR };
    }

    // With browser redirect enabled, Supabase navigates away when `data.url` is set.
    // If navigation did not occur (edge cases), fail closed.
    if (!data.url) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR };
    }

    window.location.assign(data.url);
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AUTH_OAUTH, error);
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export function authConfirmRedirectUrl(): string {
  return `${window.location.origin}${AUTH_ADAPTER_CONFIRM_PATH}`;
}

export type { OAuthProvider };
