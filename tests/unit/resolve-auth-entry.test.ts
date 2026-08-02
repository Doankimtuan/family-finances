import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";

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

  it("routes to home when a user session exists", async () => {
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
