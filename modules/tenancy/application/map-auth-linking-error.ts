/**
 * Stable UI codes for Auth identity-linking conflicts (BR-02b / AC-002b).
 * Fail closed — never invent a second profile or silent merge.
 */

import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_ERROR_MESSAGE_NEEDLE,
  AUTH_LINKING_CONFLICT_CODES,
  SUPABASE_AUTH_ERROR_CODE,
  type AuthConfirmErrorCode,
  type AuthLinkingConflictCode,
} from "./auth-constants";

export {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_LINKING_CONFLICT_CODES,
  type AuthConfirmErrorCode,
  type AuthLinkingConflictCode,
};

export type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
  name?: string | null;
};

const CONFLICT_CODES = new Set<string>(AUTH_LINKING_CONFLICT_CODES);

const CANCELLED_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.ACCESS_DENIED,
  AUTH_ERROR_MESSAGE_NEEDLE.USER_CANCELLED,
  AUTH_ERROR_MESSAGE_NEEDLE.USER_CANCELED,
  AUTH_ERROR_MESSAGE_NEEDLE.CANCELLED_BY_USER,
  AUTH_ERROR_MESSAGE_NEEDLE.CANCELED_BY_USER,
] as const;

const LINKING_DISABLED_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.MANUAL_LINKING,
  AUTH_ERROR_MESSAGE_NEEDLE.LINKING_DISABLED,
  AUTH_ERROR_MESSAGE_NEEDLE.IDENTITY_LINKING_NOT_ENABLED,
] as const;

const IDENTITY_CONFLICT_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.IDENTITY_ALREADY_LINKED,
  AUTH_ERROR_MESSAGE_NEEDLE.IDENTITY_ALREADY_LINKED_SHORT,
  AUTH_ERROR_MESSAGE_NEEDLE.ALREADY_LINKED_TO_ANOTHER_USER,
  AUTH_ERROR_MESSAGE_NEEDLE.ALREADY_ASSOCIATED_WITH_ANOTHER,
] as const;

const EMAIL_MISMATCH_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.EMAIL_MISMATCH,
  AUTH_ERROR_MESSAGE_NEEDLE.DIFFERENT_EMAIL,
  AUTH_ERROR_MESSAGE_NEEDLE.EMAIL_DOES_NOT_MATCH,
  AUTH_ERROR_MESSAGE_NEEDLE.HIDE_MY_EMAIL,
] as const;

const DUPLICATE_ACCOUNT_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.USER_ALREADY_REGISTERED,
  AUTH_ERROR_MESSAGE_NEEDLE.ALREADY_BEEN_REGISTERED,
  AUTH_ERROR_MESSAGE_NEEDLE.DUPLICATE,
  AUTH_ERROR_MESSAGE_NEEDLE.MULTIPLE_ACCOUNTS,
] as const;

const GENERIC_LINK_CONFLICT_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.CONFLICT,
  AUTH_ERROR_MESSAGE_NEEDLE.CANNOT_LINK,
  AUTH_ERROR_MESSAGE_NEEDLE.UNABLE_TO_LINK,
] as const;

const INVALID_PKCE_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.CODE_VERIFIER,
  AUTH_ERROR_MESSAGE_NEEDLE.PKCE,
  AUTH_ERROR_MESSAGE_NEEDLE.AUTH_CODE_AND_VERIFIER,
] as const;

const INVALID_GENERIC_MESSAGE_NEEDLES = [
  AUTH_ERROR_MESSAGE_NEEDLE.EXPIRED,
  AUTH_ERROR_MESSAGE_NEEDLE.INVALID,
] as const;

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function isAuthLinkingConflictCode(
  code: string | undefined | null,
): code is AuthLinkingConflictCode {
  return Boolean(code && CONFLICT_CODES.has(code));
}

export function isAuthConfirmErrorCode(
  code: string | undefined | null,
): code is AuthConfirmErrorCode {
  return (
    code === AUTH_CONFIRM_ERROR_CODE.UNCONFIGURED ||
    code === AUTH_CONFIRM_ERROR_CODE.INVALID ||
    code === AUTH_CONFIRM_ERROR_CODE.UNKNOWN ||
    code === AUTH_CONFIRM_ERROR_CODE.CANCELLED ||
    isAuthLinkingConflictCode(code)
  );
}

/**
 * Map Supabase Auth / OAuth callback errors to stable confirm/login codes.
 */
export function mapAuthLinkingError(
  error: AuthErrorLike | null | undefined,
): AuthConfirmErrorCode {
  if (!error) {
    return AUTH_CONFIRM_ERROR_CODE.INVALID;
  }

  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  const combined = `${code} ${message}`;

  if (
    code === SUPABASE_AUTH_ERROR_CODE.ACCESS_DENIED ||
    includesAny(combined, CANCELLED_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.CANCELLED;
  }

  if (
    code === SUPABASE_AUTH_ERROR_CODE.MANUAL_LINKING_DISABLED ||
    includesAny(combined, LINKING_DISABLED_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.LINKING_DISABLED;
  }

  if (
    code === SUPABASE_AUTH_ERROR_CODE.IDENTITY_ALREADY_EXISTS ||
    includesAny(combined, IDENTITY_CONFLICT_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT;
  }

  if (
    code === SUPABASE_AUTH_ERROR_CODE.EMAIL_CONFLICT ||
    includesAny(combined, EMAIL_MISMATCH_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.EMAIL_MISMATCH;
  }

  if (
    code === SUPABASE_AUTH_ERROR_CODE.USER_ALREADY_EXISTS ||
    includesAny(combined, DUPLICATE_ACCOUNT_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.DUPLICATE_ACCOUNT;
  }

  if (includesAny(combined, GENERIC_LINK_CONFLICT_MESSAGE_NEEDLES)) {
    return AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT;
  }

  if (
    code === SUPABASE_AUTH_ERROR_CODE.FLOW_STATE_NOT_FOUND ||
    includesAny(combined, INVALID_PKCE_MESSAGE_NEEDLES)
  ) {
    return AUTH_CONFIRM_ERROR_CODE.INVALID;
  }

  if (includesAny(combined, INVALID_GENERIC_MESSAGE_NEEDLES)) {
    return AUTH_CONFIRM_ERROR_CODE.INVALID;
  }

  return AUTH_CONFIRM_ERROR_CODE.UNKNOWN;
}

/**
 * Map OAuth redirect query `error` / `error_description` (IdP / GoTrue).
 */
export function mapOAuthCallbackQuery(params: {
  error?: string | null;
  errorDescription?: string | null;
}): AuthConfirmErrorCode {
  const error = params.error?.trim();
  const errorDescription = params.errorDescription?.trim();
  if (!error && !errorDescription) {
    return AUTH_CONFIRM_ERROR_CODE.INVALID;
  }
  return mapAuthLinkingError({
    code: error ?? undefined,
    message: errorDescription ?? error ?? undefined,
  });
}
