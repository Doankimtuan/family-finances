import { beforeEach, describe, expect, it, vi } from "vitest";
import { JarBudgetState } from "@/modules/plan/application/plan-constants";
import { JarPlanKind } from "@/modules/plan/application/jar-types";

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

vi.mock("@/modules/tenancy/application/get-home-household-context", () => ({
  getHomeHouseholdContext: vi.fn(async () => ({
    householdId: "h1",
    householdName: "Home",
    locale: "en-VN",
    timezone: "Asia/Ho_Chi_Minh",
    baseCurrency: "VND",
    monthCloseMode: "assisted",
    incomeAllocateMode: "suggest",
    canEdit: true,
  })),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getCurrentJarBudgets } from "@/modules/plan/application/queries/get-current-jar-budgets";

const JAR_ID = "jar-needs";
const writes: Array<{ table: string; method: string }> = [];

function thenable(data: unknown, error: null | object = null) {
  const result = { data, error };
  const query: Record<string, unknown> = {};
  const self = () => query;
  for (const method of [
    "select",
    "eq",
    "neq",
    "in",
    "gte",
    "lt",
    "order",
  ] as const) {
    query[method] = vi.fn(self);
  }
  query.insert = vi.fn((payload: unknown) => {
    writes.push({ table: String(query.__table), method: "insert" });
    void payload;
    return query;
  });
  query.upsert = vi.fn((payload: unknown) => {
    writes.push({ table: String(query.__table), method: "upsert" });
    void payload;
    return query;
  });
  query.update = vi.fn(() => {
    writes.push({ table: String(query.__table), method: "update" });
    return query;
  });
  query.maybeSingle = vi.fn(async () => result);
  query.then = (
    resolve: (value: typeof result) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return query;
}

describe("getCurrentJarBudgets", () => {
  beforeEach(() => {
    writes.length = 0;
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
      membershipId: "m1",
    });
  });

  it("does not INSERT snapshots and still returns current-period budget values", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: (table: string) => {
        const query = thenable(
          table === "households"
            ? {
                timezone: "Asia/Ho_Chi_Minh",
                qualifying_monthly_income: 20_000_000,
                base_currency: "VND",
                month_close_mode: "assisted",
                income_allocate_mode: "suggest",
              }
            : table === "jars"
              ? [
                  {
                    id: JAR_ID,
                    name: "Needs",
                    kind: "spending",
                    sort_order: 1,
                    is_archived: false,
                    is_paused: false,
                    rollover_mode: "carry",
                    jar_plans: {
                      plan_kind: JarPlanKind.FIXED,
                      percent_bps: 0,
                      fixed_amount: 15_000_000,
                    },
                  },
                ]
              : [],
        );
        query.__table = table;
        if (table === "households") {
          query.maybeSingle = vi.fn(async () => ({
            data: {
              timezone: "Asia/Ho_Chi_Minh",
              qualifying_monthly_income: 20_000_000,
              base_currency: "VND",
              month_close_mode: "assisted",
              income_allocate_mode: "suggest",
            },
            error: null,
          }));
        }
        return query;
      },
    } as never);

    const summary = await getCurrentJarBudgets(
      new Date("2026-09-08T00:00:00Z"),
    );
    expect(writes).toEqual([]);
    expect(summary?.byJarId[JAR_ID]).toMatchObject({
      budgetAmount: 15_000_000,
      spentAmount: 0,
      state: JarBudgetState.NO_SPENDING,
    });
  });
});
