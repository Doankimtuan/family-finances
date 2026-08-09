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
import { changeHouseholdRole } from "@/modules/tenancy/application/change-household-role";
import { changeHouseholdRoleInputSchema } from "@/modules/tenancy/application/change-household-role.schema";

const membershipId = "550e8400-e29b-41d4-a716-446655440000";

describe("changeHouseholdRoleInputSchema", () => {
  it("accepts only Partner and Admin", () => {
    expect(
      changeHouseholdRoleInputSchema.safeParse({
        membershipId,
        role: "partner",
      }).success,
    ).toBe(true);
    expect(
      changeHouseholdRoleInputSchema.safeParse({
        membershipId,
        role: "owner",
      }).success,
    ).toBe(false);
  });
});

describe("changeHouseholdRole", () => {
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

    await expect(
      changeHouseholdRole({ membershipId, role: "admin" }),
    ).resolves.toEqual({ ok: false, code: "forbidden" });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("derives actor authorization before calling the role RPC", async () => {
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
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);

    await expect(
      changeHouseholdRole({ membershipId, role: "partner" }),
    ).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("change_household_member_role", {
      p_membership_id: membershipId,
      p_role: "partner",
    });
  });
});
