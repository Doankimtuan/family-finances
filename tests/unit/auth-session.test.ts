import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { signInWithPassword } from "@/modules/tenancy/application/sign-in";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { MONEY_ACTION_DENIED_REASON } from "@/modules/tenancy/application/tenancy-constants";

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed when Auth is unconfigured", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });

    await expect(
      signInWithPassword({ email: "a@b.com", password: "secret" }),
    ).resolves.toEqual({ ok: false, code: "unconfigured" });
  });

  it("returns ok on successful sign-in", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: async () => ({ data: {}, error: null }),
      },
    } as never);

    await expect(
      signInWithPassword({ email: "a@b.com", password: "secret" }),
    ).resolves.toEqual({ ok: true });
  });

  it("maps auth errors to invalid_credentials", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: async () => ({
          data: {},
          error: { message: "Invalid" },
        }),
      },
    } as never);

    await expect(
      signInWithPassword({ email: "a@b.com", password: "wrong" }),
    ).resolves.toEqual({ ok: false, code: "invalid_credentials" });
  });
});

describe("assertMoneyActionAllowed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies unauthenticated callers", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getClaims: async () => ({ data: null, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as never);

    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    });
  });

  it("fail-closes without active membership", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getClaims: async () => ({
          data: { claims: { sub: "u1" } },
          error: null,
        }),
        getUser: async () => ({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(resolveActiveMembership("u1")).resolves.toBeNull();
    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });
  });
});

describe("getSessionUser auth failure logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
  });

  it("does not log expected missing-session control flow", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: {
            __isAuthError: true,
            name: "AuthSessionMissingError",
            code: undefined,
          },
        }),
      },
    } as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getSessionUser()).resolves.toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("keeps unexpected auth failures observable", async () => {
    vi.mocked(createSupabaseServerClient).mockRejectedValue(
      new Error("provider unavailable"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getSessionUser()).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "tenancy.auth.session" }),
    );
    errorSpy.mockRestore();
  });

  it("also treats a thrown missing-session error as expected control flow", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockRejectedValue({
          __isAuthError: true,
          name: "AuthSessionMissingError",
        }),
      },
    } as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getSessionUser()).resolves.toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not log Next dynamic rendering control flow", async () => {
    vi.mocked(createSupabaseServerClient).mockRejectedValue({
      digest: "DYNAMIC_SERVER_USAGE",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getSessionUser()).resolves.toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
