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
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ADAPTER_CONFIRM_PATH,
} from "@/modules/tenancy/application/auth-constants";

const VALID_REDIRECT = `http://localhost:3000${AUTH_ADAPTER_CONFIRM_PATH}`;

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
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED,
    });
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
    ).resolves.toEqual({ ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID });
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
          data: { url: "https://accounts.google.com/o/oauth2/v2/auth?x=1" },
          error: null,
        }),
      },
    } as never);

    await expect(
      startOAuthSignIn({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: true,
      url: "https://accounts.google.com/o/oauth2/v2/auth?x=1",
    });
  });

  it("returns provider_error when Supabase fails", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithOAuth: async () => ({
          data: { url: null },
          error: { message: "provider down" },
        }),
      },
    } as never);

    await expect(
      startOAuthSignIn({
        provider: "apple",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR,
    });
  });

  it("returns unknown on unexpected throw", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error("boom"));

    await expect(
      startOAuthSignIn({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({ ok: false, code: AUTH_ACTION_ERROR_CODE.UNKNOWN });
  });
});
