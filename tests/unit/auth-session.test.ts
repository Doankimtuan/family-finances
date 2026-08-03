import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
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
        getUser: async () => ({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
    } as never);

    await expect(resolveActiveMembership("u1")).resolves.toBeNull();
    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });
  });
});
