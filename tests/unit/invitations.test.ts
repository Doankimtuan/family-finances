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

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { createInvitation } from "@/modules/tenancy/application/create-invitation";
import { acceptInvitation } from "@/modules/tenancy/application/accept-invitation";
import { revokeInvitation } from "@/modules/tenancy/application/revoke-invitation";
import { inviteEmailSchema } from "@/modules/tenancy/application/invitation.schema";
import { INVITATION_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";

describe("inviteEmailSchema", () => {
  it("accepts valid emails", () => {
    expect(inviteEmailSchema.safeParse({ email: "a@b.com" }).success).toBe(
      true,
    );
  });

  it("rejects invalid emails", () => {
    expect(inviteEmailSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("createInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for bad email", async () => {
    await expect(createInvitation({ email: "x" })).resolves.toEqual({
      ok: false,
      code: INVITATION_ERROR_CODE.INVALID,
    });
  });

  it("returns unconfigured when Auth missing", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });
    await expect(
      createInvitation({ email: "partner@example.com" }),
    ).resolves.toEqual({ ok: false, code: INVITATION_ERROR_CODE.UNCONFIGURED });
  });

  it("returns unauthenticated without session", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue(null);
    await expect(
      createInvitation({ email: "partner@example.com" }),
    ).resolves.toEqual({
      ok: false,
      code: INVITATION_ERROR_CODE.UNAUTHENTICATED,
    });
  });

  it("returns token on success", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: [
          {
            invitation_id: "inv-1",
            token: "550e8400-e29b-41d4-a716-446655440000",
            expires_at: "2026-08-09T00:00:00Z",
          },
        ],
        error: null,
      }),
    } as never);

    await expect(
      createInvitation({ email: "partner@example.com" }),
    ).resolves.toEqual({
      ok: true,
      invitationId: "inv-1",
      token: "550e8400-e29b-41d4-a716-446655440000",
      expiresAt: "2026-08-09T00:00:00Z",
    });
  });

  it.each(["Household already has two partners", "Household is full"])(
    "maps household full errors: %s",
    async (message) => {
      vi.mocked(getSupabaseEnv).mockReturnValue({
        url: "https://example.supabase.co",
        key: "key",
        isConfigured: true,
      });
      vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
      vi.mocked(createSupabaseServerClient).mockResolvedValue({
        rpc: async () => ({
          data: null,
          error: { message },
        }),
      } as never);

      await expect(
        createInvitation({ email: "partner@example.com" }),
      ).resolves.toEqual({
        ok: false,
        code: INVITATION_ERROR_CODE.HOUSEHOLD_FULL,
      });
    },
  );
});

describe("acceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for bad token", async () => {
    await expect(acceptInvitation("not-a-uuid")).resolves.toEqual({
      ok: false,
      code: INVITATION_ERROR_CODE.INVALID,
    });
  });

  it("returns household id on success", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u2" } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({ data: "hh-1", error: null }),
    } as never);

    await expect(
      acceptInvitation("550e8400-e29b-41d4-a716-446655440000"),
    ).resolves.toEqual({ ok: true, householdId: "hh-1" });
  });
});

describe("revokeInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when RPC fails accordingly", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: async () => ({
        data: null,
        error: { message: "Invitation not found" },
      }),
    } as never);

    await expect(
      revokeInvitation("550e8400-e29b-41d4-a716-446655440000"),
    ).resolves.toEqual({ ok: false, code: "not_found" });
  });
});
