import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  QualifyingIncomeSource,
} from "@/modules/plan/application/plan-constants";
import { currentPeriodMonth } from "@/modules/plan/application/ritual-period";
import { previousPeriodMonth } from "@/modules/plan/application/jar-rollover";
import { getPlanBudgetHistory } from "@/modules/plan/application/queries/get-current-jar-budgets";

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

type QueryResult = { data: unknown; error: null };

function createQuery(result: QueryResult) {
  const promise = Promise.resolve(result);
  const query = {
    select: () => query,
    eq: () => query,
    in: () => query,
    gte: () => query,
    lt: () => query,
    order: () => query,
    maybeSingle: () => promise,
    then: promise.then.bind(promise),
  };
  return query;
}

describe("getPlanBudgetHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "user-1",
      householdId: "household-1",
    });
  });

  it("shows saved jar history when another jar snapshot is missing", async () => {
    const periodMonth = previousPeriodMonth(currentPeriodMonth());
    const snapshot = {
      id: "snapshot-1",
      household_id: "household-1",
      jar_id: "jar-1",
      period_month: periodMonth,
      jar_name: "Needs",
      plan_kind: JarPlanKind.FIXED,
      percent_bps: 0,
      fixed_amount: 100_000,
      rollover_mode: JarRolloverMode.RESET,
      qualifying_income: 500_000,
      qualifying_income_source: QualifyingIncomeSource.CONFIGURED,
      rule_budget: 100_000,
      rollover_credit: 0,
    };
    const results: Record<string, QueryResult> = {
      households: {
        data: {
          timezone: "Asia/Ho_Chi_Minh",
          qualifying_monthly_income: 500_000,
          base_currency: "VND",
        },
        error: null,
      },
      jar_period_rule_snapshots: { data: [snapshot], error: null },
      jars: {
        data: [
          {
            id: "jar-1",
            created_at: "2020-01-01T00:00:00.000Z",
            kind: JarKind.SPENDING,
          },
          {
            id: "jar-2",
            created_at: "2020-01-01T00:00:00.000Z",
            kind: JarKind.SPENDING,
          },
        ],
        error: null,
      },
      transactions: { data: [], error: null },
      loan_payments: { data: [], error: null },
      jar_period_adjustments: { data: [], error: null },
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: (table: string) => createQuery(results[table]),
    } as never);

    const history = await getPlanBudgetHistory(periodMonth);

    expect(history?.jars).toHaveLength(1);
    expect(history?.missingJarSnapshotCount).toBe(1);
  });
});
