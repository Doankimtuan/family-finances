import { afterEach, describe, expect, it, vi } from "vitest";

describe("getSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is unconfigured when env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { getSupabaseEnv } = await import("@/modules/platform/supabase/env");
    expect(getSupabaseEnv().isConfigured).toBe(false);
  });

  it("rejects placeholder example values", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "your-project-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "your-publishable-key");
    const { getSupabaseEnv } = await import("@/modules/platform/supabase/env");
    expect(getSupabaseEnv().isConfigured).toBe(false);
  });

  it("rejects invalid URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const { getSupabaseEnv } = await import("@/modules/platform/supabase/env");
    expect(getSupabaseEnv().isConfigured).toBe(false);
  });

  it("accepts real https URL + key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_real_key",
    );
    const { getSupabaseEnv } = await import("@/modules/platform/supabase/env");
    const env = getSupabaseEnv();
    expect(env.isConfigured).toBe(true);
    expect(env.url).toBe("https://example.supabase.co");
  });

  it("requireSupabaseEnv throws when unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "your-project-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "your-publishable-key");
    const {
      requireSupabaseEnv,
      SupabaseConfigurationError,
      SUPABASE_PLATFORM_ERROR_CODE,
    } = await import("@/modules/platform/supabase/env");
    expect(() => requireSupabaseEnv()).toThrow(SupabaseConfigurationError);
    try {
      requireSupabaseEnv();
    } catch (error) {
      expect(error).toMatchObject({
        code: SUPABASE_PLATFORM_ERROR_CODE.UNCONFIGURED,
      });
    }
  });
});
