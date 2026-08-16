import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mapGoalRow,
  mapRecurringRow,
} from "@/modules/plan/application/goal-recurring-types";
import {
  createGoalInputSchema,
  contributeToGoalInputSchema,
} from "@/modules/plan/application/commands/upsert-goal";
import { createRecurringInputSchema } from "@/modules/plan/application/commands/upsert-recurring";
import { GoalType } from "@/modules/plan/application/plan-constants";

describe("mapGoalRow", () => {
  it("computes progress without inventing a bank balance field", () => {
    const goal = mapGoalRow({
      id: "g1",
      name: "Emergency",
      target_amount: 10_000_000,
      funded_amount: 2_500_000,
      target_date: "2026-12-01",
      status: "active",
    });
    expect(goal.progressPercent).toBe(25);
    expect(goal).not.toHaveProperty("balance");
  });

  it("allows linked-value progress above 100", () => {
    expect(
      mapGoalRow({
        id: "g2",
        name: "Done",
        target_amount: 100,
        funded_amount: 150,
        target_date: null,
        status: "completed",
      }).progressPercent,
    ).toBe(150);
  });
});

describe("mapRecurringRow", () => {
  it("keeps positive amount with explicit direction (BR-06)", () => {
    const rule = mapRecurringRow({
      id: "r1",
      name: "Rent",
      direction: "expense",
      amount: 8_000_000,
      frequency: "monthly",
      interval_count: 1,
      day_of_month: 5,
      day_of_week: null,
      start_date: "2026-01-01",
      next_run_date: "2026-08-05",
      is_active: true,
    });
    expect(rule.direction).toBe("expense");
    expect(rule.amount).toBe(8_000_000);
  });
});

describe("goal / recurring schemas", () => {
  it("rejects non-positive contribute amounts (BR-06)", () => {
    expect(
      contributeToGoalInputSchema.safeParse({
        goalId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 0,
      }).success,
    ).toBe(false);
    expect(
      contributeToGoalInputSchema.safeParse({
        goalId: "550e8400-e29b-41d4-a716-446655440000",
        amount: -10,
      }).success,
    ).toBe(false);
    expect(
      contributeToGoalInputSchema.safeParse({
        goalId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 1000,
      }).success,
    ).toBe(true);
  });

  it("requires positive goal target", () => {
    expect(
      createGoalInputSchema.safeParse({
        name: "Trip",
        targetAmount: 0,
        goalType: GoalType.SAVE_UP,
      }).success,
    ).toBe(false);
    expect(
      createGoalInputSchema.safeParse({
        name: "Trip",
        targetAmount: 5_000_000,
        goalType: GoalType.SAVE_UP,
      }).success,
    ).toBe(true);
  });

  it("requires positive recurring amount and direction", () => {
    expect(
      createRecurringInputSchema.safeParse({
        name: "Salary",
        direction: "income",
        amount: 20_000_000,
        frequency: "monthly",
        startDate: "2026-08-01",
      }).success,
    ).toBe(true);
    expect(
      createRecurringInputSchema.safeParse({
        name: "Salary",
        direction: "income",
        amount: -1,
        frequency: "monthly",
        startDate: "2026-08-01",
      }).success,
    ).toBe(false);
  });
});

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
import { listGoals } from "@/modules/plan/application/queries/list-goals";

describe("listGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without membership", async () => {
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: false,
      reason: "no_membership",
    });
    await expect(listGoals()).resolves.toBeNull();
  });

  it("lists goals for household", async () => {
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
                  data: { base_currency: "VND" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "goal_funding_links") {
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              neq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "g1",
                      name: "Emergency",
                      target_amount: 100,
                      funded_amount: 40,
                      target_date: null,
                      status: "active",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      },
    } as never);

    const listed = await listGoals();
    expect(listed?.goals).toHaveLength(1);
    expect(listed?.goals[0]?.progressPercent).toBe(40);
  });
});
