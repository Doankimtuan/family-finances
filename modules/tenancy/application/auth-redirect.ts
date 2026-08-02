import { AUTH_ADAPTER_CONFIRM_PATH } from "./auth-constants";

/**
 * Auth confirm redirects must stay same-origin on the adapter path.
 * Relies on Supabase dashboard allowlist as a second gate.
 */
export function isAllowedAuthConfirmRedirectTo(
  redirectTo: string,
  expectedOrigin: string,
): boolean {
  try {
    const url = new URL(redirectTo);
    return (
      url.origin === expectedOrigin &&
      url.pathname === AUTH_ADAPTER_CONFIRM_PATH
    );
  } catch {
    return false;
  }
}

/**
 * Safe in-app `next` path after confirm — same-origin path only, no scheme tricks.
 */
export function isSafeInAppNextPath(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}
