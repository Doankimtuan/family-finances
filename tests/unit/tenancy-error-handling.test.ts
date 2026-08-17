import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { signInWithPassword } from "@/modules/tenancy/application/sign-in";
import { createInvitation } from "@/modules/tenancy/application/create-invitation";
import { acceptInvitation } from "@/modules/tenancy/application/accept-invitation";
import { updateHouseholdPolicies } from "@/modules/tenancy/application/update-household-policies";
import { AUTH_ACTION_ERROR_CODE } from "@/modules/tenancy/application/auth-constants";
import { INVITATION_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";

const configuredEnv = {
  url: "https://example.supabase.co",
  key: "key",
  isConfigured: true,
};

describe("Tenancy error boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseEnv).mockReturnValue(configuredEnv);
    vi.mocked(getSessionUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(resolveActiveMembership).mockResolvedValue({
      householdId: "household-1",
      userId: "user-1",
      role: "admin",
    });
  });

  it("keeps invalid credentials expected and logs unexpected auth failures", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValueOnce({
            data: {},
            error: { code: "invalid_credentials", message: "opaque" },
          })
          .mockResolvedValueOnce({
            data: {},
            error: { code: "server_error", message: "provider unavailable" },
          }),
      },
    } as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      signInWithPassword({ email: "a@b.com", password: "wrong" }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.INVALID_CREDENTIALS,
    });
    await expect(
      signInWithPassword({ email: "a@b.com", password: "wrong" }),
    ).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR,
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("prefers structured invitation codes over provider text", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: INVITATION_ERROR_CODE.ALREADY_PENDING,
          message: "opaque",
        },
      }),
    } as never);

    await expect(
      createInvitation({ email: "partner@example.com" }),
    ).resolves.toEqual({
      ok: false,
      code: INVITATION_ERROR_CODE.ALREADY_PENDING,
    });
  });

  it("preserves legacy invitation lifecycle semantics behind one mapper", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "P0001", message: "Invitation expired" },
      }),
    } as never);

    await expect(
      acceptInvitation("550e8400-e29b-41d4-a716-446655440000"),
    ).resolves.toEqual({ ok: false, code: INVITATION_ERROR_CODE.EXPIRED });
  });

  it("logs unexpected household RPC failures without leaking provider shape", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "XX000", message: "database unavailable" },
      }),
    } as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      updateHouseholdPolicies({
        overspendPolicy: "warn",
        monthCloseMode: "assisted",
        incomeAllocateMode: "suggest",
      }),
    ).resolves.toEqual({ ok: false, code: "unknown" });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "tenancy.household.policies",
        context: { householdId: "household-1" },
      }),
    );
    errorSpy.mockRestore();
  });
});
