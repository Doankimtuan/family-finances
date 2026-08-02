import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/admin", () => ({
  getSupabaseServiceRoleEnv: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  createSupabaseAdminClient,
  getSupabaseServiceRoleEnv,
} from "@/modules/platform/supabase/admin";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { signOut } from "@/modules/tenancy/application/sign-out";
import { deleteAccount } from "@/modules/tenancy/application/delete-account";
import { AUTH_ACTION_ERROR_CODE } from "@/modules/tenancy/application/auth-constants";

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed when Auth is unconfigured", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });
    await expect(signOut()).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED,
    });
  });

  it("signs out successfully", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signOut: async () => ({ error: null }),
      },
    } as never);

    await expect(signOut()).resolves.toEqual({ ok: true });
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed without service role", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSupabaseServiceRoleEnv).mockReturnValue({
      url: "",
      serviceRoleKey: "",
      isConfigured: false,
    });

    await expect(deleteAccount()).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED,
    });
  });

  it("requires an authenticated session", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSupabaseServiceRoleEnv).mockReturnValue({
      url: "https://example.supabase.co",
      serviceRoleKey: "service",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue(null);

    await expect(deleteAccount()).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED,
    });
  });

  it("deletes the Auth user then signs out", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSupabaseServiceRoleEnv).mockReturnValue({
      url: "https://example.supabase.co",
      serviceRoleKey: "service",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "user-1" } as never);
    const deleteUser = vi.fn(async () => ({ data: null, error: null }));
    vi.mocked(createSupabaseAdminClient).mockReturnValue({
      auth: { admin: { deleteUser } },
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signOut: async () => ({ error: null }),
      },
    } as never);

    await expect(deleteAccount()).resolves.toEqual({ ok: true });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
  });
});
