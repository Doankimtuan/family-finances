import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ERROR_MESSAGE_NEEDLE,
  SUPABASE_AUTH_ERROR_CODE,
} from "./auth-constants";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_RPC_MESSAGE_NEEDLE,
  INVITATION_ERROR_CODE,
  INVITATION_RPC_MESSAGE_NEEDLE,
  SUPABASE_POSTGRES_ERROR_CODE,
  type HouseholdErrorCode,
  type InvitationErrorCode,
} from "./tenancy-constants";

type ProviderError = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
};

function asProviderError(error: unknown): ProviderError {
  return typeof error === "object" && error !== null
    ? (error as ProviderError)
    : {};
}

function field(error: ProviderError, key: keyof ProviderError): string {
  const value = error[key];
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function providerText(error: unknown): string {
  const providerError = asProviderError(error);
  return [
    field(providerError, "details"),
    field(providerError, "hint"),
    field(providerError, "message"),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAny(text: string, needles: readonly string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function isKnownCode<T extends string>(
  code: string,
  values: readonly T[],
): code is T {
  return values.includes(code as T);
}

function providerCode(error: unknown): string {
  return field(asProviderError(error), "code");
}

export function classifySignInError(
  error: unknown,
):
  | typeof AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS
  | typeof AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR {
  const code = providerCode(error);
  if (
    code === SUPABASE_AUTH_ERROR_CODE.INVALID_CREDENTIALS ||
    code === SUPABASE_AUTH_ERROR_CODE.EMAIL_NOT_CONFIRMED
  ) {
    return AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS;
  }

  const text = providerText(error);
  return hasAny(text, [
    AUTH_ERROR_MESSAGE_NEEDLE.INVALID_LOGIN_CREDENTIALS,
    AUTH_ERROR_MESSAGE_NEEDLE.INVALID,
  ])
    ? AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS
    : AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR;
}

export function classifySignUpError(
  error: unknown,
):
  | typeof AUTH_ACTION_ERROR_CODE.ALREADY_REGISTERED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID {
  const code = providerCode(error);
  const text = providerText(error);
  if (
    code === SUPABASE_AUTH_ERROR_CODE.USER_ALREADY_EXISTS ||
    hasAny(text, [
      AUTH_ERROR_MESSAGE_NEEDLE.USER_ALREADY_REGISTERED,
      AUTH_ERROR_MESSAGE_NEEDLE.ALREADY_BEEN_REGISTERED,
      AUTH_ERROR_MESSAGE_NEEDLE.DUPLICATE,
    ])
  ) {
    return AUTH_ACTION_ERROR_CODE.ALREADY_REGISTERED;
  }
  return AUTH_ACTION_ERROR_CODE.INVALID;
}

function classifyStructuredDomainCode<T extends string>(
  error: unknown,
  values: readonly T[],
): T | undefined {
  const providerError = asProviderError(error);
  for (const key of ["code", "details", "hint"] as const) {
    const value = field(providerError, key);
    if (isKnownCode(value, values)) return value;
  }
  return undefined;
}

export const HOUSEHOLD_RPC_OPERATION = {
  CREATE: "create",
  ROLE: "role",
  SETTINGS: "settings",
} as const;

export type HouseholdRpcOperation =
  (typeof HOUSEHOLD_RPC_OPERATION)[keyof typeof HOUSEHOLD_RPC_OPERATION];

export function classifyHouseholdRpcError(
  error: unknown,
  operation: HouseholdRpcOperation,
): HouseholdErrorCode {
  const structured = classifyStructuredDomainCode(
    error,
    Object.values(HOUSEHOLD_ERROR_CODE),
  );
  if (structured) return structured;

  const code = providerCode(error);
  if (code === SUPABASE_POSTGRES_ERROR_CODE.INSUFFICIENT_PRIVILEGE) {
    return HOUSEHOLD_ERROR_CODE.FORBIDDEN;
  }
  if (code === SUPABASE_POSTGRES_ERROR_CODE.INVALID_TEXT) {
    return HOUSEHOLD_ERROR_CODE.INVALID;
  }

  const text = providerText(error);
  if (
    operation === HOUSEHOLD_RPC_OPERATION.CREATE &&
    hasAny(text, [
      INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_BELONGS,
      HOUSEHOLD_RPC_MESSAGE_NEEDLE.ALREADY_BELONGS,
    ])
  ) {
    return HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER;
  }
  if (
    operation === HOUSEHOLD_RPC_OPERATION.CREATE &&
    hasAny(text, [
      HOUSEHOLD_RPC_MESSAGE_NEEDLE.NAME_TOO_SHORT,
      HOUSEHOLD_RPC_MESSAGE_NEEDLE.NAME_INVALID,
    ])
  ) {
    return HOUSEHOLD_ERROR_CODE.INVALID;
  }
  if (
    hasAny(text, [
      HOUSEHOLD_RPC_MESSAGE_NEEDLE.ADMIN_ROLE,
      HOUSEHOLD_RPC_MESSAGE_NEEDLE.FORBIDDEN,
    ])
  ) {
    return HOUSEHOLD_ERROR_CODE.FORBIDDEN;
  }
  if (hasAny(text, [HOUSEHOLD_RPC_MESSAGE_NEEDLE.MEMBER_NOT_FOUND])) {
    return HOUSEHOLD_ERROR_CODE.MEMBER_NOT_FOUND;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.NO_ACTIVE_HOUSEHOLD])) {
    return HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION])) {
    return HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED;
  }
  if (hasAny(text, [AUTH_ERROR_MESSAGE_NEEDLE.INVALID])) {
    return HOUSEHOLD_ERROR_CODE.INVALID;
  }
  return HOUSEHOLD_ERROR_CODE.UNKNOWN;
}

export function classifyInvitationRpcError(
  error: unknown,
): InvitationErrorCode {
  const structured = classifyStructuredDomainCode(
    error,
    Object.values(INVITATION_ERROR_CODE),
  );
  if (structured) return structured;

  const code = providerCode(error);
  if (code === SUPABASE_POSTGRES_ERROR_CODE.INVALID_TEXT) {
    return INVITATION_ERROR_CODE.INVALID;
  }

  const text = providerText(error);
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.INVALID_EMAIL])) {
    return INVITATION_ERROR_CODE.INVALID;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_MEMBER])) {
    return INVITATION_ERROR_CODE.ALREADY_MEMBER;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_PENDING])) {
    return INVITATION_ERROR_CODE.ALREADY_PENDING;
  }
  if (
    hasAny(text, [
      INVITATION_RPC_MESSAGE_NEEDLE.TWO_PARTNERS,
      INVITATION_RPC_MESSAGE_NEEDLE.HOUSEHOLD_FULL,
    ])
  ) {
    return INVITATION_ERROR_CODE.HOUSEHOLD_FULL;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.NO_ACTIVE_HOUSEHOLD])) {
    return INVITATION_ERROR_CODE.NO_HOUSEHOLD;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.NOT_FOUND])) {
    return INVITATION_ERROR_CODE.NOT_FOUND;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.NOT_PENDING])) {
    return INVITATION_ERROR_CODE.NOT_PENDING;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.EXPIRED])) {
    return INVITATION_ERROR_CODE.EXPIRED;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.EMAIL_MISMATCH])) {
    return INVITATION_ERROR_CODE.EMAIL_MISMATCH;
  }
  if (hasAny(text, [INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION])) {
    return INVITATION_ERROR_CODE.UNAUTHENTICATED;
  }
  return INVITATION_ERROR_CODE.UNKNOWN;
}

export function logTenancyFailure(
  operation: string,
  error: unknown,
  context?: Readonly<
    Record<string, string | number | boolean | null | undefined>
  >,
): void {
  logActionFailure({ operation, error, context });
}
