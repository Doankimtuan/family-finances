/**
 * Auth route, query, status, and error constants — avoid inline magic strings.
 */

export const AUTH_ADAPTER_ROOT_PATH = "/auth";
export const AUTH_ADAPTER_CONFIRM_PATH = "/auth/confirm";
export const AUTH_ADAPTER_SIGNOUT_PATH = "/auth/signout";

export const AUTH_LOCALE_LOGIN_SEGMENT = "login";
export const AUTH_LOCALE_HOME_SEGMENT = "home";
export const AUTH_LOCALE_WELCOME_SEGMENT = "welcome";
export const AUTH_LOCALE_CONFIRM_SEGMENT = "auth/confirm";

export const AUTH_CONFIRM_STATUS = {
  OK: "ok",
  ERROR: "error",
  PENDING: "pending",
} as const;

export type AuthConfirmStatus =
  (typeof AUTH_CONFIRM_STATUS)[keyof typeof AUTH_CONFIRM_STATUS];

export const AUTH_CONFIRM_QUERY = {
  STATUS: "status",
  CODE: "code",
  TOKEN_HASH: "token_hash",
  TYPE: "type",
  ERROR: "error",
  ERROR_DESCRIPTION: "error_description",
  NEXT: "next",
} as const;

export const AUTH_CONFIRM_ERROR_CODE = {
  UNCONFIGURED: "unconfigured",
  INVALID: "invalid",
  UNKNOWN: "unknown",
  CANCELLED: "cancelled",
  IDENTITY_CONFLICT: "identity_conflict",
  LINKING_DISABLED: "linking_disabled",
  DUPLICATE_ACCOUNT: "duplicate_account",
  EMAIL_MISMATCH: "email_mismatch",
} as const;

export const AUTH_LINKING_CONFLICT_CODES = [
  AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT,
  AUTH_CONFIRM_ERROR_CODE.LINKING_DISABLED,
  AUTH_CONFIRM_ERROR_CODE.DUPLICATE_ACCOUNT,
  AUTH_CONFIRM_ERROR_CODE.EMAIL_MISMATCH,
] as const;

export type AuthLinkingConflictCode =
  (typeof AUTH_LINKING_CONFLICT_CODES)[number];

export type AuthConfirmErrorCode =
  (typeof AUTH_CONFIRM_ERROR_CODE)[keyof typeof AUTH_CONFIRM_ERROR_CODE];

export const AUTH_ACTION_ERROR_CODE = {
  UNCONFIGURED: "unconfigured",
  UNAUTHENTICATED: "unauthenticated",
  INVALID: "invalid",
  PROVIDER_ERROR: "provider_error",
  UNKNOWN: "unknown",
} as const;

export const SUPABASE_AUTH_ERROR_CODE = {
  ACCESS_DENIED: "access_denied",
  MANUAL_LINKING_DISABLED: "manual_linking_disabled",
  IDENTITY_ALREADY_EXISTS: "identity_already_exists",
  EMAIL_CONFLICT: "email_conflict",
  USER_ALREADY_EXISTS: "user_already_exists",
  FLOW_STATE_NOT_FOUND: "flow_state_not_found",
} as const;

export const AUTH_ERROR_MESSAGE_NEEDLE = {
  ACCESS_DENIED: "access_denied",
  USER_CANCELLED: "user cancelled",
  USER_CANCELED: "user canceled",
  CANCELLED_BY_USER: "cancelled by user",
  CANCELED_BY_USER: "canceled by user",
  MANUAL_LINKING: "manual linking",
  LINKING_DISABLED: "linking is disabled",
  IDENTITY_LINKING_NOT_ENABLED: "identity linking is not enabled",
  IDENTITY_ALREADY_LINKED: "identity is already linked",
  IDENTITY_ALREADY_LINKED_SHORT: "identity already linked",
  ALREADY_LINKED_TO_ANOTHER_USER: "already linked to another user",
  ALREADY_ASSOCIATED_WITH_ANOTHER: "already associated with another",
  EMAIL_MISMATCH: "email mismatch",
  DIFFERENT_EMAIL: "different email",
  EMAIL_DOES_NOT_MATCH: "email does not match",
  HIDE_MY_EMAIL: "hide my email",
  USER_ALREADY_REGISTERED: "user already registered",
  ALREADY_BEEN_REGISTERED: "already been registered",
  DUPLICATE: "duplicate",
  MULTIPLE_ACCOUNTS: "multiple accounts",
  CONFLICT: "conflict",
  CANNOT_LINK: "cannot link",
  UNABLE_TO_LINK: "unable to link",
  CODE_VERIFIER: "code verifier",
  PKCE: "pkce",
  AUTH_CODE_AND_VERIFIER: "both auth code and code verifier",
  EXPIRED: "expired",
  INVALID: "invalid",
} as const;

export const HTTP_HEADER = {
  ORIGIN: "origin",
  REFERER: "referer",
} as const;

export const HTTP_STATUS = {
  SEE_OTHER: 303,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
} as const;

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const OTP_VERIFY_TYPE = {
  EMAIL: "email",
  SIGNUP: "signup",
  INVITE: "invite",
  MAGICLINK: "magiclink",
  RECOVERY: "recovery",
} as const;

export type OtpVerifyType =
  (typeof OTP_VERIFY_TYPE)[keyof typeof OTP_VERIFY_TYPE];

export const OTP_VERIFY_TYPES = new Set<string>(Object.values(OTP_VERIFY_TYPE));

export function localeLoginPath(locale: string): string {
  return `/${locale}/${AUTH_LOCALE_LOGIN_SEGMENT}`;
}

export function localeHomePath(locale: string): string {
  return `/${locale}/${AUTH_LOCALE_HOME_SEGMENT}`;
}

export function localeWelcomePath(locale: string): string {
  return `/${locale}/${AUTH_LOCALE_WELCOME_SEGMENT}`;
}

export function localeConfirmPath(locale: string): string {
  return `/${locale}/${AUTH_LOCALE_CONFIRM_SEGMENT}`;
}

export function buildAuthConfirmAdapterUrl(
  origin: string,
  nextPath?: string,
): string {
  const url = new URL(AUTH_ADAPTER_CONFIRM_PATH, origin);
  if (nextPath) {
    url.searchParams.set(AUTH_CONFIRM_QUERY.NEXT, nextPath);
  }
  return url.toString();
}

export function isAuthAdapterPath(pathname: string): boolean {
  return (
    pathname === AUTH_ADAPTER_ROOT_PATH ||
    pathname.startsWith(`${AUTH_ADAPTER_ROOT_PATH}/`)
  );
}
