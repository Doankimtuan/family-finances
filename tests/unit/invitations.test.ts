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

vi.mock("@/modules/tenancy/application/get-invitation-preview", () => ({
  getInvitationPreview: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { getInvitationPreview } from "@/modules/tenancy/application/get-invitation-preview";
import { createInvitation } from "@/modules/tenancy/application/create-invitation";
import {
  acceptInvitation,
  acceptInvitationById,
} from "@/modules/tenancy/application/accept-invitation";
import { listUserInvitations } from "@/modules/tenancy/application/list-user-invitations";
import { revokeInvitation } from "@/modules/tenancy/application/revoke-invitation";
import { inviteEmailSchema } from "@/modules/tenancy/application/invitation.schema";
import {
  INVITATION_ERROR_CODE,
  INVITATION_STATUS,
} from "@/modules/tenancy/application/tenancy-constants";

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

describe("listUserInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only matching recipient invitations without exposing tokens", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "u2",
      email: "partner@example.com",
    } as never);
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      gt: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.gt.mockResolvedValue({
      data: [
        {
          id: "inv-match",
          email: "PARTNER@example.com",
          token: "550e8400-e29b-41d4-a716-446655440000",
          status: INVITATION_STATUS.PENDING,
          expires_at: "2026-08-09T00:00:00Z",
        },
        {
          id: "inv-other",
          email: "other@example.com",
          token: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          status: INVITATION_STATUS.PENDING,
          expires_at: "2026-08-09T00:00:00Z",
        },
        {
          id: "inv-match-second",
          email: "partner@example.com",
          token: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          status: INVITATION_STATUS.PENDING,
          expires_at: "2026-08-09T00:00:00Z",
        },
      ],
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => query),
    } as never);
    vi.mocked(getInvitationPreview).mockImplementation(async (token) => ({
      ok: true,
      preview: {
        householdName: token,
        inviteEmail: "partner@example.com",
        status: INVITATION_STATUS.PENDING,
        expiresAt: "2026-08-09T00:00:00Z",
        isExpired: false,
      },
    }));

    await expect(listUserInvitations()).resolves.toEqual({
      ok: true,
      invitations: [
        {
          id: "inv-match",
          householdName: "550e8400-e29b-41d4-a716-446655440000",
        },
        {
          id: "inv-match-second",
          householdName: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        },
      ],
    });
    expect(getInvitationPreview).toHaveBeenCalledTimes(2);
    expect(getInvitationPreview).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(getInvitationPreview).toHaveBeenCalledWith(
      "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    );
  });
});

describe("acceptInvitationById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid ids before reading the invitation", async () => {
    await expect(acceptInvitationById("not-a-uuid")).resolves.toEqual({
      ok: false,
      code: INVITATION_ERROR_CODE.INVALID,
    });
    expect(getSessionUser).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("accepts the token read from the recipient-scoped invitation row", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "u2",
      email: "partner@example.com",
    } as never);
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          email: "PARTNER@example.com",
          token: "550e8400-e29b-41d4-a716-446655440000",
          status: INVITATION_STATUS.PENDING,
          expires_at: "2099-08-09T00:00:00Z",
        },
        error: null,
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    const rpc = vi.fn().mockResolvedValue({ data: "hh-1", error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => query),
      rpc,
    } as never);

    await expect(
      acceptInvitationById("550e8400-e29b-41d4-a716-446655440000"),
    ).resolves.toEqual({ ok: true, householdId: "hh-1" });
    expect(rpc).toHaveBeenCalledWith("accept_household_invitation", {
      p_token: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it.each([
    {
      email: "partner@example.com",
      status: INVITATION_STATUS.REVOKED,
      expiresAt: "2099-08-09T00:00:00Z",
      code: INVITATION_ERROR_CODE.NOT_PENDING,
    },
    {
      email: "partner@example.com",
      status: INVITATION_STATUS.ACCEPTED,
      expiresAt: "2099-08-09T00:00:00Z",
      code: INVITATION_ERROR_CODE.NOT_PENDING,
    },
    {
      email: "partner@example.com",
      status: INVITATION_STATUS.PENDING,
      expiresAt: "2000-08-09T00:00:00Z",
      code: INVITATION_ERROR_CODE.EXPIRED,
    },
    {
      email: "other@example.com",
      status: INVITATION_STATUS.PENDING,
      expiresAt: "2099-08-09T00:00:00Z",
      code: INVITATION_ERROR_CODE.EMAIL_MISMATCH,
    },
  ])("rejects stale or mismatched invitation metadata", async (invitation) => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "u2",
      email: "partner@example.com",
    } as never);
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          email: invitation.email,
          token: "550e8400-e29b-41d4-a716-446655440000",
          status: invitation.status,
          expires_at: invitation.expiresAt,
        },
        error: null,
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    const rpc = vi.fn();
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => query),
      rpc,
    } as never);

    await expect(
      acceptInvitationById("550e8400-e29b-41d4-a716-446655440000"),
    ).resolves.toEqual({ ok: false, code: invitation.code });
    expect(rpc).not.toHaveBeenCalled();
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
