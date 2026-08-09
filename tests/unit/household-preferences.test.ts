import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({ getSupabaseEnv: vi.fn() }));
vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { updateHouseholdPreferences } from "@/modules/tenancy/application/update-household-preferences";
import { householdPreferencesInputSchema } from "@/modules/tenancy/application/household-preferences.schema";

const input = {
  locale: "vi-VN" as const,
  timezone: "Asia/Ho_Chi_Minh" as const,
  baseCurrency: "VND" as const,
};

describe("householdPreferencesInputSchema", () => {
  it("accepts the supported Vietnam-first preference values", () => {
    expect(householdPreferencesInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects unsupported currency and timezone semantics", () => {
    expect(
      householdPreferencesInputSchema.safeParse({
        ...input,
        timezone: "UTC",
        baseCurrency: "USD",
      }).success,
    ).toBe(false);
  });
});

describe("updateHouseholdPreferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks Partner before opening a mutation client", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u2" } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue({
      householdId: "h1",
      userId: "u2",
      role: "partner",
    });

    await expect(updateHouseholdPreferences(input)).resolves.toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("sends only approved values through the Admin RPC", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue({
      householdId: "h1",
      userId: "u1",
      role: "admin",
    });
    const rpc = vi.fn(async () => ({ data: "h1", error: null }));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(updateHouseholdPreferences(input)).resolves.toEqual({
      ok: true,
      householdId: "h1",
    });
    expect(rpc).toHaveBeenCalledWith("update_household_preferences", {
      p_locale: "vi-VN",
      p_timezone: "Asia/Ho_Chi_Minh",
      p_base_currency: "VND",
    });
  });
});
