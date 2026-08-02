import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";
import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

describe("resolveAuthEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to welcome when Supabase is not configured", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });

    await expect(resolveAuthEntry()).resolves.toBe("welcome");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("routes to onboard when session exists without membership", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
      },
    } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue(null);

    await expect(resolveAuthEntry()).resolves.toBe("onboard");
  });

  it("routes to home when session has active membership", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
      },
    } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue({
      householdId: "h1",
      userId: "u1",
      role: "admin",
    });

    await expect(resolveAuthEntry()).resolves.toBe("home");
  });

  it("routes to welcome when there is no user", async () => {
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

    await expect(resolveAuthEntry()).resolves.toBe("welcome");
  });
});

describe("pathForAuthEntry", () => {
  it("maps destinations to app paths", () => {
    expect(pathForAuthEntry("welcome")).toBe(APP_PATH.WELCOME);
    expect(pathForAuthEntry("onboard")).toBe(APP_PATH.ONBOARD);
    expect(pathForAuthEntry("home")).toBe(APP_PATH.HOME);
  });
});
