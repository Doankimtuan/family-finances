import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseBrowserClient } from "@/modules/platform/supabase/browser";
import { startOAuthInputSchema, type StartOAuthInput } from "./oauth.schema";
import {
  mapAuthLinkingError,
  type AuthConfirmErrorCode,
} from "./map-auth-linking-error";
import { isAllowedAuthConfirmRedirectTo } from "./auth-redirect";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_CONFIRM_ERROR_CODE,
} from "./auth-constants";

export type LinkIdentityResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | (typeof AUTH_ACTION_ERROR_CODE)[keyof typeof AUTH_ACTION_ERROR_CODE]
        | AuthConfirmErrorCode;
    };

/**
 * Authenticated manual identity link (Supabase `linkIdentity`) from the browser
 * so the PKCE verifier is stored where `/auth/confirm` can read it.
 * Requires Manual Linking enabled in the Auth project (ops policy).
 * Settings UI entry is deferred — this command is the application contract.
 */
export async function linkIdentity(
  raw: StartOAuthInput,
): Promise<LinkIdentityResult> {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED };
    }

    const { data, error } = await supabase.auth.linkIdentity({
      provider: parsed.data.provider,
      options: {
        redirectTo: parsed.data.redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      const mapped = mapAuthLinkingError(error);
      if (
        mapped === AUTH_CONFIRM_ERROR_CODE.UNKNOWN ||
        mapped === AUTH_CONFIRM_ERROR_CODE.INVALID
      ) {
        return { ok: false, code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR };
      }
      return { ok: false, code: mapped };
    }

    if (!data.url) {
      return { ok: false, code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR };
    }

    window.location.assign(data.url);
    return { ok: true };
  } catch {
    return { ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN };
  }
}
