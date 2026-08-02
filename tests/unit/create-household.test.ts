import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

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
import { createHousehold } from "@/modules/tenancy/application/create-household";
import { createHouseholdInputSchema } from "@/modules/tenancy/application/create-household.schema";
import { HOUSEHOLD_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";

describe("createHouseholdInputSchema", () => {
  it("accepts balanced and simple presets", () => {
    expect(
      createHouseholdInputSchema.safeParse({
        name: "Our home",
        accountName: "Cash",
        planPreset: "balanced",
      }).success,
    ).toBe(true);
    expect(
      createHouseholdInputSchema.safeParse({
        name: "Nhà mình",
        accountName: "Tiền mặt",
        planPreset: "simple",
      }).success,
    ).toBe(true);
  });

  it("rejects short household names", () => {
    expect(
      createHouseholdInputSchema.safeParse({
        name: "A",
        accountName: "Cash",
        planPreset: "balanced",
      }).success,
    ).toBe(false);
  });
});

describe("createHousehold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for bad input", async () => {
    await expect(
      createHousehold({
        name: "A",
        accountName: "Cash",
        planPreset: "balanced",
      }),
    ).resolves.toEqual({ ok: false, code: HOUSEHOLD_ERROR_CODE.INVALID });
  });

  it("returns unconfigured when Auth env missing", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });

    await expect(
      createHousehold({
        name: "Our home",
        accountName: "Cash",
        planPreset: "balanced",
      }),
    ).resolves.toEqual({ ok: false, code: HOUSEHOLD_ERROR_CODE.UNCONFIGURED });
  });

  it("returns unauthenticated without session", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue(null);

    await expect(
      createHousehold({
        name: "Our home",
        accountName: "Cash",
        planPreset: "balanced",
      }),
    ).resolves.toEqual({
      ok: false,
      code: HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED,
    });
  });

  it("returns already_member when membership exists", async () => {
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

    await expect(
      createHousehold({
        name: "Our home",
        accountName: "Cash",
        planPreset: "balanced",
      }),
    ).resolves.toEqual({
      ok: false,
      code: HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER,
    });
  });

  it("returns household id on successful rpc", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({ data: "hh-new", error: null }),
    } as never);

    await expect(
      createHousehold({
        name: "Our home",
        accountName: "Cash",
        planPreset: "balanced",
      }),
    ).resolves.toEqual({ ok: true, householdId: "hh-new" });
  });
});
