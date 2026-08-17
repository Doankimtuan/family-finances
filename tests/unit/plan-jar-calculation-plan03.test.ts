import { describe, expect, it } from "vitest";
import {
  calculateJarBudgetMetrics,
  calculateJarRuleBudget,
  calculateJarSpentAmount,
  calculateQualifyingPostedIncome,
  classifyJarEnvelopeEffect,
  resolveJarBudgetState,
  resolveQualifyingMonthlyIncome,
  type JarBudgetTransaction,
} from "@/modules/plan/application/jar-budget";
import {
  JarPlanKind,
  type PlanJar,
} from "@/modules/plan/application/jar-types";
import { TransactionLedgerType } from "@/modules/ledger/application/ledger-constants";
import {
  currentPeriodMonth,
  periodMonthEndDate,
} from "@/modules/plan/application/ritual-period";

const fixedJar: PlanJar = {
  id: "fixed",
  name: "Rent",
  kind: "spending",
  state: "active",
  sortOrder: 1,
  capacityDelta: 0,
  rolloverMode: "reset",
  plan: {
    kind: JarPlanKind.FIXED,
    percentBps: 0,
    fixedAmount: 15_000_000,
  },
};

const percentJar: PlanJar = {
  ...fixedJar,
  id: "percent",
  name: "Lifestyle",
  plan: {
    kind: JarPlanKind.PERCENT,
    percentBps: 5_000,
    fixedAmount: 0,
  },
};

function transaction(
  overrides: Partial<JarBudgetTransaction> &
    Pick<JarBudgetTransaction, "type" | "amount">,
): JarBudgetTransaction {
  return { status: "posted", jar_id: "percent", ...overrides };
}

describe("PLAN 03 Jar calculation engine", () => {
  it("calculates fixed and percent rule budgets with integer arithmetic", () => {
    expect(calculateJarRuleBudget(fixedJar, 30_000_000)).toBe(15_000_000);
    expect(calculateJarRuleBudget(percentJar, 30_000_000)).toBe(15_000_000);
    expect(calculateJarRuleBudget(percentJar.plan, 30_000_000)).toBe(15_000_000);
    expect(
      calculateJarRuleBudget(
        {
          ...percentJar,
          plan: { ...percentJar.plan!, percentBps: 3_333 },
        },
        10_001,
      ),
    ).toBe(3_333);
  });

  it("uses configured income first, then recurring, then posted, then none", () => {
    expect(
      resolveQualifyingMonthlyIncome({
        configuredIncome: 25_000_000,
        recurringIncome: 40_000_000,
        postedIncome: 5_000_000,
      }),
    ).toEqual({ amount: 25_000_000, source: "configured" });
    expect(
      resolveQualifyingMonthlyIncome({
        recurringIncome: 40_000_000,
        postedIncome: 5_000_000,
      }),
    ).toEqual({ amount: 40_000_000, source: "recurring_fallback" });
    expect(
      resolveQualifyingMonthlyIncome({
        recurringIncome: 0,
        postedIncome: 5_000_000,
      }),
    ).toEqual({ amount: 5_000_000, source: "posted_fallback" });
    expect(resolveQualifyingMonthlyIncome({})).toEqual({
      amount: 0,
      source: "none",
    });
  });

  it("excludes transfers, borrowing, investment proceeds, investment income, refunds, and reversals from posted qualifying income", () => {
    expect(
      calculateQualifyingPostedIncome([
        transaction({ type: TransactionLedgerType.INCOME, amount: 20_000_000 }),
        transaction({
          type: TransactionLedgerType.TRANSFER_IN,
          amount: 5_000_000,
        }),
        transaction({
          type: TransactionLedgerType.DEBT_BORROWING,
          amount: 6_000_000,
        }),
        transaction({
          type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
          amount: 7_000_000,
        }),
        transaction({
          type: TransactionLedgerType.INVESTMENT_INCOME,
          amount: 8_000_000,
        }),
        transaction({
          type: TransactionLedgerType.INCOME,
          amount: 2_000_000,
          is_reversal: true,
        }),
        transaction({
          type: TransactionLedgerType.INCOME,
          amount: 3_000_000,
          status: "reversed",
        }),
      ]),
    ).toBe(20_000_000);
  });

  it("classifies envelope-consuming and neutral Money events", () => {
    expect(
      classifyJarEnvelopeEffect(
        transaction({ type: TransactionLedgerType.EXPENSE, amount: 1_000 }),
      ),
    ).toBe(1_000);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.INVESTMENT_BUY,
          amount: 2_000,
        }),
      ),
    ).toBe(2_000);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.LIABILITY_PAYMENT,
          amount: 3_000,
        }),
      ),
    ).toBe(0);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.LIABILITY_PAYMENT,
          amount: 3_000,
          is_loan_payment: true,
        }),
      ),
    ).toBe(3_000);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 4_000,
        }),
      ),
    ).toBe(0);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 5_000,
          savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT",
        }),
      ),
    ).toBe(5_000);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.TRANSFER_IN,
          amount: 6_000,
          savings_event_kind: "SAVINGS_PRINCIPAL_RETURN",
        }),
      ),
    ).toBe(0);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
          amount: 7_000,
        }),
      ),
    ).toBe(0);
    expect(
      classifyJarEnvelopeEffect(
        transaction({
          type: TransactionLedgerType.DEBT_BORROWING,
          amount: 8_000,
        }),
      ),
    ).toBe(0);
  });

  it("restores spent capacity for linked refunds and corrections without double counting", () => {
    const original = transaction({
      id: "expense-1",
      type: TransactionLedgerType.EXPENSE,
      amount: 10_000,
    });
    const refund = transaction({
      id: "refund-1",
      type: TransactionLedgerType.INCOME,
      amount: 4_000,
      is_reversal: true,
      reverses_transaction_id: "expense-1",
    });
    expect(calculateJarSpentAmount("percent", [original, refund])).toBe(6_000);

    const correction = transaction({
      id: "corrected-expense",
      type: TransactionLedgerType.EXPENSE,
      amount: 7_000,
    });
    const reversal = transaction({
      id: "reversal",
      type: TransactionLedgerType.INCOME,
      amount: 10_000,
      is_reversal: true,
      reverses_transaction_id: "expense-1",
    });
    expect(
      calculateJarSpentAmount("percent", [original, reversal, correction]),
    ).toBe(7_000);
  });

  it("keeps historical jar_id classification independent from current category mapping", () => {
    const historical = transaction({
      type: TransactionLedgerType.EXPENSE,
      amount: 9_000,
      jar_id: "historical-jar",
    });
    expect(calculateJarSpentAmount("historical-jar", [historical])).toBe(9_000);
    expect(calculateJarSpentAmount("new-category-jar", [historical])).toBe(0);
  });

  it("returns the approved derived metrics and all five states", () => {
    expect(calculateJarBudgetMetrics(fixedJar, "fixed", [])).toMatchObject({
      budgetAmount: 15_000_000,
      spentAmount: 0,
      remainingAmount: 15_000_000,
      usagePercent: 0,
      state: "no_spending",
    });
    expect(
      resolveJarBudgetState({
        budgetAmount: 10,
        spentAmount: 5,
        usagePercent: 50,
      }),
    ).toBe("healthy");
    expect(
      resolveJarBudgetState({
        budgetAmount: 10,
        spentAmount: 8,
        usagePercent: 80,
      }),
    ).toBe("near_limit");
    expect(
      resolveJarBudgetState({
        budgetAmount: 10,
        spentAmount: 12,
        usagePercent: 120,
      }),
    ).toBe("overspent");
    expect(
      resolveJarBudgetState({
        budgetAmount: 0,
        spentAmount: 0,
        usagePercent: 0,
      }),
    ).toBe("no_budget");
    expect(
      resolveJarBudgetState({
        budgetAmount: 0,
        spentAmount: 2,
        usagePercent: 0,
      }),
    ).toBe("overspent");
    expect(
      calculateJarBudgetMetrics(
        percentJar,
        "percent",
        [
          transaction({
            type: TransactionLedgerType.EXPENSE,
            amount: 12_000_000,
          }),
        ],
        { periodIncome: 20_000_000 },
      ),
    ).toMatchObject({
      budgetAmount: 10_000_000,
      spentAmount: 12_000_000,
      remainingAmount: -2_000_000,
      usagePercent: 120,
      state: "overspent",
    });
  });

  it("uses the household-local month boundary rather than UTC date", () => {
    expect(
      currentPeriodMonth(
        new Date("2026-07-31T17:30:00.000Z"),
        "Asia/Ho_Chi_Minh",
      ),
    ).toBe("2026-08-01");
    expect(
      currentPeriodMonth(
        new Date("2026-07-31T16:59:59.000Z"),
        "Asia/Ho_Chi_Minh",
      ),
    ).toBe("2026-07-01");
    expect(periodMonthEndDate("2026-08-01")).toBe("2026-08-31");
  });
});
