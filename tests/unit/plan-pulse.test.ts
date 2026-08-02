import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    key: "key",
    isConfigured: true,
  })),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { mapJarRow } from "@/modules/plan/application/jar-types";
import { getPlanPulse } from "@/modules/plan/application/queries/get-plan-pulse";

describe("mapJarRow", () => {
  it("marks non-archived jars as active allocation targets", () => {
    expect(
      mapJarRow({
        id: "j1",
        name: "Needs",
        kind: "spending",
        sort_order: 1,
        is_archived: false,
      }),
    ).toMatchObject({ state: "active", kind: "spending" });
  });

  it("marks archived jars as non-targets", () => {
    expect(
      mapJarRow({
        id: "j2",
        name: "Old",
        kind: "buffer",
        sort_order: 9,
        is_archived: true,
      }).state,
    ).toBe("archived");
  });
});

describe("getPlanPulse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    });
    await expect(getPlanPulse()).resolves.toBeNull();
  });

  it("exposes only active jars in pulse preview", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "households") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    base_currency: "VND",
                    month_close_mode: "assisted",
                    income_allocate_mode: "suggest",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: "a1",
                    name: "Needs",
                    kind: "spending",
                    sort_order: 1,
                    is_archived: false,
                  },
                  {
                    id: "a2",
                    name: "Old",
                    kind: "savings",
                    sort_order: 2,
                    is_archived: true,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      },
    } as never);

    const pulse = await getPlanPulse();
    expect(pulse).toMatchObject({
      householdId: "h1",
      monthCloseMode: "assisted",
      archivedJarCount: 1,
    });
    expect(pulse?.activeJars).toHaveLength(1);
    expect(pulse?.activeJars[0]?.name).toBe("Needs");
    // BR-01: pulse never invents a bank-style jar balance field
    expect(pulse?.activeJars[0]).not.toHaveProperty("balance");
  });
});
