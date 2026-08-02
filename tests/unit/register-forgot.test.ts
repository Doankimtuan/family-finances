import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { signUpWithPassword } from "@/modules/tenancy/application/sign-up";
import { requestPasswordReset } from "@/modules/tenancy/application/request-password-reset";

describe("signUpWithPassword", () => {
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
      signUpWithPassword({
        email: "a@b.com",
        password: "password1",
        emailRedirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "unconfigured" });
  });

  it("rejects invalid input", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });

    await expect(
      signUpWithPassword({
        email: "not-an-email",
        password: "short",
        emailRedirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "invalid" });
  });

  it("returns confirm when session is absent after sign-up", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signUp: async () => ({
          data: { session: null, user: { id: "u1" } },
          error: null,
        }),
      },
    } as never);

    await expect(
      signUpWithPassword({
        email: "a@b.com",
        password: "password1",
        emailRedirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: true, next: "confirm" });
  });

  it("returns home when session is present after sign-up", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signUp: async () => ({
          data: { session: { access_token: "t" }, user: { id: "u1" } },
          error: null,
        }),
      },
    } as never);

    await expect(
      signUpWithPassword({
        email: "a@b.com",
        password: "password1",
        emailRedirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: true, next: "onboard" });
  });

  it("maps already-registered errors", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signUp: async () => ({
          data: { session: null, user: null },
          error: {
            message: "User already registered",
            code: "user_already_exists",
          },
        }),
      },
    } as never);

    await expect(
      signUpWithPassword({
        email: "a@b.com",
        password: "password1",
        emailRedirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "already_registered" });
  });
});

describe("requestPasswordReset", () => {
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
      requestPasswordReset({
        email: "a@b.com",
        redirectTo: "http://localhost/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "unconfigured" });
  });

  it("returns ok when reset email is accepted", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        resetPasswordForEmail: async () => ({ data: {}, error: null }),
      },
    } as never);

    await expect(
      requestPasswordReset({
        email: "a@b.com",
        redirectTo: "http://localhost/auth/confirm?next=/login",
      }),
    ).resolves.toEqual({ ok: true });
  });
});
