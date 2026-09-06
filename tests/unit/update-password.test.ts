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

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { AUTH_ACTION_ERROR_CODE } from "@/modules/tenancy/application/auth-constants";
import { updatePassword } from "@/modules/tenancy/application/update-password";

const validInput = {
  password: "new-password",
  confirmPassword: "new-password",
};

describe("updatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input before touching Auth", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });

    await expect(
      updatePassword({ password: "short", confirmPassword: "different" }),
    ).resolves.toEqual({ ok: false, code: AUTH_ACTION_ERROR_CODE.INVALID });
    expect(getSessionUser).not.toHaveBeenCalled();
  });

  it("fails closed when Auth is unconfigured", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "",
      key: "",
      isConfigured: false,
    });

    await expect(updatePassword(validInput)).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNCONFIGURED,
    });
  });

  it("requires the recovery session", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue(null);

    await expect(updatePassword(validInput)).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED,
    });
  });

  it("updates the password for the current user", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { updateUser },
    } as never);

    await expect(updatePassword(validInput)).resolves.toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: validInput.password });
  });

  it("maps provider failures to a stable error", async () => {
    vi.mocked(getSupabaseEnv).mockReturnValue({
      url: "https://example.supabase.co",
      key: "key",
      isConfigured: true,
    });
    vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        updateUser: async () => ({ error: new Error("provider failure") }),
      },
    } as never);

    await expect(updatePassword(validInput)).resolves.toEqual({
      ok: false,
      code: AUTH_ACTION_ERROR_CODE.UNKNOWN,
    });
  });
});
