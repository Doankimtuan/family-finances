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
import { updateHouseholdPolicies } from "@/modules/tenancy/application/update-household-policies";
import { householdPoliciesInputSchema } from "@/modules/tenancy/application/household-policies.schema";

describe("householdPoliciesInputSchema", () => {
  it("defaults align with AC-007 / AC-009 seed values", () => {
    expect(
      householdPoliciesInputSchema.safeParse({
        overspendPolicy: "warn",
        monthCloseMode: "assisted",
        incomeAllocateMode: "suggest",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown overspend values", () => {
    expect(
      householdPoliciesInputSchema.safeParse({
        overspendPolicy: "ignore",
        monthCloseMode: "assisted",
        incomeAllocateMode: "suggest",
      }).success,
    ).toBe(false);
  });
});

describe("updateHouseholdPolicies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden for partner role", async () => {
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

    await expect(
      updateHouseholdPolicies({
        overspendPolicy: "block",
        monthCloseMode: "assisted",
        incomeAllocateMode: "suggest",
      }),
    ).resolves.toEqual({ ok: false, code: "forbidden" });
  });

  it("returns success for admin rpc", async () => {
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
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({ data: "h1", error: null }),
    } as never);

    await expect(
      updateHouseholdPolicies({
        overspendPolicy: "warn",
        monthCloseMode: "assisted",
        incomeAllocateMode: "suggest",
      }),
    ).resolves.toEqual({ ok: true, householdId: "h1" });
  });
});
