import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getSupabaseServiceRoleEnv", () => {
  it("prefers the modern secret key and falls back to service role", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_real_key",
    );
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_modern");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy_service_role");

    const { getSupabaseServiceRoleEnv } =
      await import("@/modules/platform/supabase/admin");
    expect(getSupabaseServiceRoleEnv()).toMatchObject({
      serviceRoleKey: "sb_secret_modern",
      isConfigured: true,
    });

    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(getSupabaseServiceRoleEnv().serviceRoleKey).toBe(
      "legacy_service_role",
    );
  });
});
