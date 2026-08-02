import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { startOAuthSignIn } from "@/modules/tenancy/application/start-oauth-sign-in";

describe("startOAuthSignIn", () => {
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
      startOAuthSignIn({
        provider: "google",
        redirectTo: "http://localhost:3000/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "unconfigured" });
  });

  it("rejects invalid provider or redirect", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });

    await expect(
      startOAuthSignIn({
        provider: "google",
        redirectTo: "not-a-url",
      }),
    ).resolves.toEqual({ ok: false, code: "invalid" });
  });

  it("returns IdP url for google", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithOAuth: async () => ({
          data: { url: "https://accounts.google.com/o/oauth2" },
          error: null,
        }),
      },
    } as never);

    await expect(
      startOAuthSignIn({
        provider: "google",
        redirectTo: "http://localhost:3000/auth/confirm",
      }),
    ).resolves.toEqual({
      ok: true,
      url: "https://accounts.google.com/o/oauth2",
    });
  });

  it("returns IdP url for apple", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithOAuth: async () => ({
          data: { url: "https://appleid.apple.com/auth" },
          error: null,
        }),
      },
    } as never);

    await expect(
      startOAuthSignIn({
        provider: "apple",
        redirectTo: "http://localhost:3000/auth/confirm",
      }),
    ).resolves.toEqual({
      ok: true,
      url: "https://appleid.apple.com/auth",
    });
  });

  it("maps provider errors", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithOAuth: async () => ({
          data: { url: null },
          error: { message: "Provider not enabled" },
        }),
      },
    } as never);

    await expect(
      startOAuthSignIn({
        provider: "google",
        redirectTo: "http://localhost:3000/auth/confirm",
      }),
    ).resolves.toEqual({ ok: false, code: "provider_error" });
  });
});
