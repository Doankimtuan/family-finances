import { describe, expect, it } from "vitest";
import {
  isAuthConfirmErrorCode,
  isAuthLinkingConflictCode,
  mapAuthLinkingError,
  mapOAuthCallbackQuery,
} from "@/modules/tenancy/application/map-auth-linking-error";
import {
  AUTH_CONFIRM_ERROR_CODE,
  SUPABASE_AUTH_ERROR_CODE,
} from "@/modules/tenancy/application/auth-constants";

describe("mapAuthLinkingError", () => {
  it("maps identity already linked to identity_conflict", () => {
    expect(
      mapAuthLinkingError({
        code: SUPABASE_AUTH_ERROR_CODE.IDENTITY_ALREADY_EXISTS,
        message: "Identity is already linked",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT);
  });

  it("maps manual linking disabled", () => {
    expect(
      mapAuthLinkingError({
        code: SUPABASE_AUTH_ERROR_CODE.MANUAL_LINKING_DISABLED,
        message: "Manual linking is disabled",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.LINKING_DISABLED);
  });

  it("maps duplicate / already registered to duplicate_account", () => {
    expect(
      mapAuthLinkingError({
        code: SUPABASE_AUTH_ERROR_CODE.USER_ALREADY_EXISTS,
        message: "User already registered",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.DUPLICATE_ACCOUNT);
  });

  it("maps email mismatch signals", () => {
    expect(
      mapAuthLinkingError({
        message: "Email does not match existing verified email",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.EMAIL_MISMATCH);
  });

  it("maps access denied / cancel to cancelled", () => {
    expect(
      mapAuthLinkingError({
        code: SUPABASE_AUTH_ERROR_CODE.ACCESS_DENIED,
        message: "User cancelled the login",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.CANCELLED);
  });

  it("maps invalid/expired to invalid", () => {
    expect(
      mapAuthLinkingError({
        message: "Invalid or expired code",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.INVALID);
  });

  it("maps missing PKCE verifier to invalid", () => {
    expect(
      mapAuthLinkingError({
        message: "both auth code and code verifier should be non-empty",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.INVALID);
    expect(
      mapAuthLinkingError({
        code: SUPABASE_AUTH_ERROR_CODE.FLOW_STATE_NOT_FOUND,
        message: "PKCE code verifier not found in storage",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.INVALID);
  });

  it("fails closed to unknown for unrecognized errors", () => {
    expect(mapAuthLinkingError({ message: "weird upstream failure" })).toBe(
      AUTH_CONFIRM_ERROR_CODE.UNKNOWN,
    );
  });

  it("treats empty error as invalid", () => {
    expect(mapAuthLinkingError(null)).toBe(AUTH_CONFIRM_ERROR_CODE.INVALID);
  });
});

describe("mapOAuthCallbackQuery", () => {
  it("maps IdP access_denied", () => {
    expect(
      mapOAuthCallbackQuery({
        error: SUPABASE_AUTH_ERROR_CODE.ACCESS_DENIED,
        errorDescription: "The user denied the request",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.CANCELLED);
  });

  it("maps linking conflict descriptions", () => {
    expect(
      mapOAuthCallbackQuery({
        error: "server_error",
        errorDescription: "Identity is already linked to another user",
      }),
    ).toBe(AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT);
  });
});

describe("code guards", () => {
  it("recognizes conflict and confirm codes", () => {
    expect(
      isAuthLinkingConflictCode(AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT),
    ).toBe(true);
    expect(isAuthLinkingConflictCode(AUTH_CONFIRM_ERROR_CODE.INVALID)).toBe(
      false,
    );
    expect(isAuthConfirmErrorCode(AUTH_CONFIRM_ERROR_CODE.CANCELLED)).toBe(
      true,
    );
    expect(isAuthConfirmErrorCode("not-a-code")).toBe(false);
  });
});
