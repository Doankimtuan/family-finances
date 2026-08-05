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
import {
  MONEY_ACTION_DENIED_REASON,
  PRODUCT_ACTION_ERROR_CODE,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  mapJarRow,
  resolveJarState,
  isAllocationTarget,
} from "@/modules/plan/application/jar-types";
import { getPlanPulse } from "@/modules/plan/application/queries/get-plan-pulse";
import { setJarState } from "@/modules/plan/application/commands/set-jar-state";
import { upsertJarPlan } from "@/modules/plan/application/commands/upsert-jar-plan";

describe("jar state matrix", () => {
  it("resolves Active / Paused / Archived with archive winning", () => {
    expect(resolveJarState({ is_archived: false, is_paused: false })).toBe(
      "active",
    );
    expect(resolveJarState({ is_archived: false, is_paused: true })).toBe(
      "paused",
    );
    expect(resolveJarState({ is_archived: true, is_paused: true })).toBe(
      "archived",
    );
  });

  it("only Active jars are allocation targets (BR-03)", () => {
    expect(isAllocationTarget({ state: "active" })).toBe(true);
    expect(isAllocationTarget({ state: "paused" })).toBe(false);
    expect(isAllocationTarget({ state: "archived" })).toBe(false);
  });

  it("maps plan without inventing a bank balance field", () => {
    const jar = mapJarRow({
      id: "j1",
      name: "Essentials",
      kind: "spending",
      sort_order: 1,
      is_archived: false,
      is_paused: false,
      capacity_delta: 0,
      jar_plans: {
        plan_kind: "percent",
        percent_bps: 5000,
        fixed_amount: 0,
      },
    });
    expect(jar.state).toBe("active");
    expect(jar.capacityDelta).toBe(0);
    expect(jar.plan).toEqual({
      kind: "percent",
      percentBps: 5000,
      fixedAmount: 0,
    });
    expect(jar).not.toHaveProperty("balance");
  });
});

describe("getPlanPulse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP,
    });
    await expect(getPlanPulse()).resolves.toBeNull();
  });

  it("exposes only active jars and counts paused/archived", async () => {
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
                    is_paused: false,
                    jar_plans: {
                      plan_kind: "percent",
                      percent_bps: 5000,
                      fixed_amount: 0,
                    },
                  },
                  {
                    id: "a2",
                    name: "Paused",
                    kind: "spending",
                    sort_order: 2,
                    is_archived: false,
                    is_paused: true,
                    jar_plans: null,
                  },
                  {
                    id: "a3",
                    name: "Old",
                    kind: "savings",
                    sort_order: 3,
                    is_archived: true,
                    is_paused: false,
                    jar_plans: null,
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
      incomeAllocateMode: "suggest",
      pausedJarCount: 1,
      archivedJarCount: 1,
    });
    expect(pulse?.activeJars).toHaveLength(1);
    expect(pulse?.activeJars[0]?.name).toBe("Needs");
    expect(pulse?.activeJars[0]).not.toHaveProperty("balance");
  });
});

describe("setJarState / upsertJarPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid plan input", async () => {
    await expect(
      upsertJarPlan({ jarId: "not-uuid", planKind: "percent", percent: 10 }),
    ).resolves.toEqual({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });

  it("maps pause flags on update", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    const unlockedMaybeSingle = vi.fn(async () => ({
      data: null,
      error: null,
    }));
    const jarMaybeSingle = vi.fn(async () => ({
      data: { id: "j1" },
      error: null,
    }));
    const jarSelect = vi.fn(() => ({ maybeSingle: jarMaybeSingle }));
    const jarEq2 = vi.fn(() => ({ select: jarSelect }));
    const jarEq1 = vi.fn(() => ({ eq: jarEq2 }));
    const update = vi.fn(() => ({ eq: jarEq1 }));

    const ritualChain = {
      select: vi.fn(() => ritualChain),
      eq: vi.fn(() => ritualChain),
      in: vi.fn(() => ritualChain),
      limit: vi.fn(() => ritualChain),
      maybeSingle: unlockedMaybeSingle,
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "month_ritual_runs") return ritualChain;
        return { update };
      },
    } as never);

    const result = await setJarState({
      jarId: "550e8400-e29b-41d4-a716-446655440000",
      state: "paused",
    });
    expect(result).toEqual({ ok: true, state: "paused" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_paused: true, is_archived: false }),
    );
  });
});
