import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseBrowserClient } from "@/modules/platform/supabase/browser";
import { linkIdentity } from "@/modules/tenancy/application/link-identity";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_ADAPTER_CONFIRM_PATH,
  AUTH_CONFIRM_ERROR_CODE,
  SUPABASE_AUTH_ERROR_CODE,
} from "@/modules/tenancy/application/auth-constants";

const TEST_ORIGIN = "http://localhost:3000";
const VALID_REDIRECT = `${TEST_ORIGIN}${AUTH_ADAPTER_CONFIRM_PATH}`;

describe("linkIdentity", () => {
  const assignSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", {
      location: {
        origin: TEST_ORIGIN,
        assign: assignSpy,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails closed when Auth is unconfigured", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });

    await expect(
      linkIdentity({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED,
    });
  });

  it("rejects non-confirm redirect targets", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });

    await expect(
      linkIdentity({
        provider: "google",
        redirectTo: `${TEST_ORIGIN}/evil`,
      }),
    ).resolves.toEqual({ ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID });
  });

  it("requires an authenticated session", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as never);

    await expect(
      linkIdentity({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED,
    });
  });

  it("navigates to IdP url when link starts", async () => {
    const idpUrl = "https://accounts.google.com/o/oauth2/link";
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
        linkIdentity: async () => ({
          data: { url: idpUrl },
          error: null,
        }),
      },
    } as never);

    await expect(
      linkIdentity({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({ ok: true });
    expect(assignSpy).toHaveBeenCalledWith(idpUrl);
  });

  it("maps identity conflict without inventing a merge", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
        linkIdentity: async () => ({
          data: { url: null },
          error: {
            code: SUPABASE_AUTH_ERROR_CODE.IDENTITY_ALREADY_EXISTS,
            message: "Identity is already linked to another user",
          },
        }),
      },
    } as never);

    await expect(
      linkIdentity({
        provider: "apple",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_CONFIRM_ERROR_CODE.IDENTITY_CONFLICT,
    });
  });

  it("maps linking_disabled", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseBrowserClient).mockReturnValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        }),
        linkIdentity: async () => ({
          data: { url: null },
          error: {
            code: SUPABASE_AUTH_ERROR_CODE.MANUAL_LINKING_DISABLED,
            message: "Manual linking is disabled",
          },
        }),
      },
    } as never);

    await expect(
      linkIdentity({
        provider: "google",
        redirectTo: VALID_REDIRECT,
      }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_CONFIRM_ERROR_CODE.LINKING_DISABLED,
    });
  });
});
