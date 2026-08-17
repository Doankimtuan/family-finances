import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMonthlyReview,
  summarizeCashFlow,
} from "@/modules/plan/application/queries/get-monthly-review";
import {
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  calculateGoalProgressPercent,
  deriveGoalFundedAmount,
  deriveGoalFundingSummary,
} from "@/modules/plan/application/goal-funding";
import { mapGoalRow } from "@/modules/plan/application/goal-recurring-types";
import { GoalFundingSourceKind } from "@/modules/plan/application/plan-constants";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getJarBudgetsForPeriod } from "@/modules/plan/application/queries/get-current-jar-budgets";
import { listJars } from "@/modules/plan/application/queries/list-jars";
import { listGoals } from "@/modules/plan/application/queries/list-goals";

type ReviewRow = Parameters<typeof summarizeCashFlow>[0][number];

function row(
  type: string,
  amount: number,
  extras: Partial<ReviewRow> = {},
): ReviewRow {
  return {
    id: crypto.randomUUID(),
    type,
    amount,
    status: TransactionStatus.POSTED,
    transaction_date: "2026-08-12",
    created_at: "2026-08-12T12:00:00.000Z",
    transfer_group_id: null,
    savings_event_kind: null,
    is_reversal: false,
    reverses_transaction_id: null,
    jar_id: null,
    category_id: "category",
    ...extras,
  };
}

describe("Monthly Review cash-flow semantics", () => {
  it("keeps expenses, savings placement, investments, and debt reduction separate", () => {
    const summary = summarizeCashFlow([
      row("income", 10_000_000),
      row("expense", 2_000_000),
      row("transfer_out", 1_000_000, {
        savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT",
        transfer_group_id: "savings-1",
      }),
      row("transfer_in", 1_000_000, {
        savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT",
        transfer_group_id: "savings-1",
      }),
      row("investment_buy", 1_500_000),
      row("debt_lending", 750_000),
    ]);

    expect(summary.income).toBe(10_000_000);
    expect(summary.expenses).toBe(2_000_000);
    expect(summary.savingsAdded).toBe(1_000_000);
    expect(summary.netInvested).toBe(1_500_000);
    expect(summary.debtPrincipalReduced).toBe(750_000);
    expect(summary.expenses).not.toBe(summary.savingsAdded);
  });

  it("does not duplicate a savings transfer pair", () => {
    const summary = summarizeCashFlow([
      row("transfer_out", 2_000_000, {
        savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT",
        transfer_group_id: "savings-2",
      }),
      row("transfer_in", 2_000_000, {
        savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT",
        transfer_group_id: "savings-2",
      }),
    ]);

    expect(summary.savingsAdded).toBe(2_000_000);
    expect(summary.activityCount).toBe(1);
  });

  it("counts normal posted income and expenses", () => {
    const summary = summarizeCashFlow([
      row(TransactionLedgerType.INCOME, 10_000_000),
      row(TransactionLedgerType.EXPENSE, 3_000_000),
    ]);

    expect(summary.income).toBe(10_000_000);
    expect(summary.expenses).toBe(3_000_000);
  });

  it("excludes reversed originals and reversal legs from income and expenses", () => {
    const summary = summarizeCashFlow([
      row(TransactionLedgerType.INCOME, 10_000_000),
      row(TransactionLedgerType.EXPENSE, 2_000_000),
      row(TransactionLedgerType.EXPENSE, 4_000_000, {
        status: TransactionStatus.REVERSED,
      }),
      row(TransactionLedgerType.INCOME, 9_000_000, {
        status: TransactionStatus.REVERSED,
      }),
      row(TransactionLedgerType.INCOME, 700_000, {
        is_reversal: true,
        reverses_transaction_id: "expense-original",
      }),
    ]);

    expect(summary.income).toBe(10_000_000);
    expect(summary.expenses).toBe(2_000_000);
  });

  it("does not count non-income inflows as income", () => {
    const summary = summarizeCashFlow([
      row(TransactionLedgerType.INVESTMENT_SELL_PROCEEDS, 12_000_000),
      row(TransactionLedgerType.DEBT_BORROWING, 5_000_000),
      row(TransactionLedgerType.INCOME, 6_000_000),
    ]);

    expect(summary.income).toBe(6_000_000);
  });
});

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/assert-money-action-allowed", () => ({
  assertMoneyActionAllowed: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/get-current-jar-budgets", () => ({
  getJarBudgetsForPeriod: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/list-jars", () => ({
  listJars: vi.fn(),
}));

vi.mock("@/modules/plan/application/queries/list-goals", () => ({
  listGoals: vi.fn(),
}));

const savingSource = (amount: number) => ({
  kind: GoalFundingSourceKind.SAVING,
  sourceId: "saving-review",
  currentAmount: amount,
});

function linkedReviewGoal(fundedAmount: number, targetAmount: number) {
  return mapGoalRow(
    {
      id: "goal-review",
      name: "Review goal",
      target_amount: targetAmount,
      funded_amount: 0,
      target_date: null,
      status: "active",
      goal_type: null,
    },
    {
      fundingLinks: [
        {
          id: "link-review",
          kind: GoalFundingSourceKind.SAVING,
          sourceId: "saving-review",
          sourceName: "Savings",
          currentAmount: fundedAmount,
        },
      ],
      fundingSummary: deriveGoalFundingSummary([savingSource(fundedAmount)]),
    },
  );
}

function supabaseReviewClient() {
  return {
    from: (table: string) => {
      if (table === "households") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  base_currency: "VND",
                  timezone: "UTC",
                  month_close_mode: null,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "month_ritual_runs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            gte: () => ({
              lt: () => ({
                order: () => ({
                  order: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      };
    },
  };
}

describe("Monthly Review goal progress consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertMoneyActionAllowed).mockResolvedValue({
      ok: true,
      userId: "u1",
      householdId: "h1",
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabaseReviewClient() as never,
    );
    vi.mocked(getJarBudgetsForPeriod).mockResolvedValue(null);
    vi.mocked(listJars).mockResolvedValue(null);
  });

  it.each([
    { caseName: "not funded", fundedAmount: 0, targetAmount: 500, expected: 0 },
    {
      caseName: "partially funded",
      fundedAmount: 200,
      targetAmount: 500,
      expected: 40,
    },
    {
      caseName: "funded exactly to target",
      fundedAmount: 500,
      targetAmount: 500,
      expected: 100,
    },
    {
      caseName: "over-funded",
      fundedAmount: 750,
      targetAmount: 500,
      expected: 150,
    },
    {
      caseName: "zero target",
      fundedAmount: 400,
      targetAmount: 0,
      expected: 0,
    },
  ])(
    "exposes canonical goal progress when $caseName",
    async ({ fundedAmount, targetAmount, expected }) => {
      vi.mocked(listGoals).mockResolvedValue({
        householdId: "h1",
        currency: "VND",
        goals: [linkedReviewGoal(fundedAmount, targetAmount)],
      });

      const review = await getMonthlyReview();

      expect(review?.goals[0]?.progressPercent).toBe(
        calculateGoalProgressPercent(
          deriveGoalFundedAmount([savingSource(fundedAmount)]),
          targetAmount,
        ),
      );
      expect(review?.goals[0]?.progressPercent).toBe(expected);
    },
  );
});
