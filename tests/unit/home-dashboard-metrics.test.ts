import { describe, expect, it } from "vitest";
import {
  calculateHomeFinancialMetrics,
  calculatePeriodComparison,
  getHomeDashboardDateRange,
} from "@/modules/home/application";
import { HomeDashboardPeriod } from "@/modules/home/application/home-constants";
import {
  TransactionLedgerType,
  TransactionStatus,
  type LedgerTransaction,
} from "@/modules/ledger/application";

function transaction(
  overrides: Partial<LedgerTransaction> = {},
): LedgerTransaction {
  return {
    id: "transaction-id",
    accountId: "account-id",
    type: TransactionLedgerType.EXPENSE,
    amount: 0,
    currency: "VND",
    transactionDate: "2026-08-01",
    note: null,
    categoryId: null,
    categoryName: null,
    jarId: null,
    jarName: null,
    status: TransactionStatus.POSTED,
    transferGroupId: null,
    loanPaymentId: null,
    reversesTransactionId: null,
    correctsTransactionId: null,
    isReversal: false,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Home dashboard period ranges", () => {
  it("uses an elapsed-day comparable prior month rather than a full prior month", () => {
    expect(
      getHomeDashboardDateRange(
        HomeDashboardPeriod.MONTH,
        new Date("2026-08-13T12:00:00.000Z"),
      ),
    ).toMatchObject({
      startDate: "2026-08-01",
      endDate: "2026-08-13",
      previousStartDate: "2026-07-01",
      previousEndDate: "2026-07-13",
    });
  });

  it("uses the calendar quarter start and matching elapsed prior-quarter window", () => {
    expect(
      getHomeDashboardDateRange(
        HomeDashboardPeriod.QUARTER,
        new Date("2026-08-13T12:00:00.000Z"),
      ),
    ).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-08-13",
      previousStartDate: "2026-04-01",
      previousEndDate: "2026-05-14",
    });
  });

  it("keeps period day counts on UTC calendar boundaries", () => {
    expect(
      getHomeDashboardDateRange(
        HomeDashboardPeriod.MONTH,
        new Date("2026-03-01T23:59:59-08:00"),
      ),
    ).toMatchObject({
      startDate: "2026-03-01",
      endDate: "2026-03-02",
      previousEndDate: "2026-02-02",
    });
  });
});

describe("Home financial metrics", () => {
  const range = {
    period: HomeDashboardPeriod.MONTH,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    previousStartDate: "2026-07-01",
    previousEndDate: "2026-07-31",
  };

  it("aggregates income, expense, net flow, and category rankings correctly", () => {
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "income-current",
          type: TransactionLedgerType.INCOME,
          amount: 12_000_000,
          transactionDate: "2026-08-04",
        }),
        transaction({
          id: "food-one",
          amount: 2_000_000,
          categoryId: "food",
          categoryName: "Ăn uống",
          transactionDate: "2026-08-05",
        }),
        transaction({
          id: "food-two",
          amount: 1_000_000,
          categoryId: "food",
          categoryName: "Ăn uống",
          transactionDate: "2026-08-07",
        }),
        transaction({
          id: "travel",
          amount: 1_000_000,
          categoryId: "travel",
          categoryName: "Di chuyển",
          transactionDate: "2026-08-08",
        }),
        transaction({
          id: "income-prior",
          type: TransactionLedgerType.INCOME,
          amount: 10_000_000,
          transactionDate: "2026-07-04",
        }),
        transaction({
          id: "expense-prior",
          amount: 5_000_000,
          transactionDate: "2026-07-05",
        }),
      ],
    });

    expect(metrics.income).toBe(12_000_000);
    expect(metrics.expense).toBe(4_000_000);
    expect(metrics.netCashFlow).toBe(8_000_000);
    expect(metrics.spendingCategories).toEqual([
      expect.objectContaining({
        id: "food",
        amount: 3_000_000,
        proportion: 0.75,
      }),
      expect.objectContaining({
        id: "travel",
        amount: 1_000_000,
        proportion: 0.25,
      }),
    ]);
    expect(metrics.expenseComparison).toEqual({
      amount: -1_000_000,
      ratio: -0.2,
    });
  });

  it("excludes transfers, refunds, and reversed originals from cash-flow reporting", () => {
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "transfer-in",
          type: TransactionLedgerType.TRANSFER_IN,
          amount: 9_000_000,
        }),
        transaction({
          id: "transfer-out",
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 9_000_000,
        }),
        transaction({
          id: "refund",
          type: TransactionLedgerType.INCOME,
          amount: 700_000,
          isReversal: true,
          reversesTransactionId: "expense-original",
        }),
        transaction({
          amount: 2_000_000,
          status: TransactionStatus.REVERSED,
        }),
        transaction({
          id: "valid-expense",
          amount: 500_000,
          categoryId: "food",
          categoryName: "Ăn uống",
        }),
      ],
    });

    expect(metrics.income).toBe(0);
    expect(metrics.expense).toBe(500_000);
    expect(metrics.netCashFlow).toBe(-500_000);
    expect(metrics.spendingCategories).toHaveLength(1);
  });
  it("keeps cash flow unavailable when the period contains transfers only", () => {
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "transfer-only",
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 1_000_000,
        }),
      ],
    });

    expect(metrics.hasTransactions).toBe(false);
    expect(metrics.netCashFlow).toBe(0);
  });

  it("does not report an unsafe comparison when the prior denominator is zero", () => {
    expect(calculatePeriodComparison(1_000_000, 0)).toBeNull();
    expect(calculatePeriodComparison(1_000_000, -1)).toBeNull();
  });
  it("keeps month charts daily and groups quarter charts into readable weekly buckets", () => {
    const monthMetrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "month-income",
          type: TransactionLedgerType.INCOME,
          amount: 1_000_000,
          transactionDate: "2026-08-01",
        }),
      ],
    });
    expect(monthMetrics.trend).toMatchObject({ granularity: "day" });
    expect(monthMetrics.trend.points).toHaveLength(31);
    expect(monthMetrics.trend.points[0]).toMatchObject({
      key: "2026-08-01",
      income: 1_000_000,
      expense: 0,
    });

    const quarterRange = {
      period: HomeDashboardPeriod.QUARTER,
      startDate: "2026-07-01",
      endDate: "2026-08-13",
      previousStartDate: "2026-04-01",
      previousEndDate: "2026-05-14",
    };
    const quarterMetrics = calculateHomeFinancialMetrics({
      range: quarterRange,
      transactions: [
        transaction({
          id: "quarter-income",
          type: TransactionLedgerType.INCOME,
          amount: 2_000_000,
          transactionDate: "2026-07-01",
        }),
        transaction({
          id: "quarter-expense",
          amount: 500_000,
          transactionDate: "2026-07-07",
        }),
      ],
    });
    expect(quarterMetrics.trend).toMatchObject({ granularity: "week" });
    expect(quarterMetrics.trend.points).toHaveLength(7);
    expect(quarterMetrics.trend.points[0]).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-07-07",
      income: 2_000_000,
      expense: 500_000,
    });
  });

  it("prepares safe spending percentages and leaves zero-expense categories empty", () => {
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "income-only",
          type: TransactionLedgerType.INCOME,
          amount: 1_000_000,
        }),
      ],
    });
    expect(metrics.spendingCategories).toEqual([]);
  });
});

describe("cross-domain reporting semantics", () => {
  const range = {
    period: HomeDashboardPeriod.MONTH,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    previousStartDate: "2026-07-01",
    previousEndDate: "2026-07-31",
  };
  it("counts investment income but excludes investment sale proceeds and buys", () => {
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: [
        transaction({
          id: "investment-income",
          type: TransactionLedgerType.INVESTMENT_INCOME,
          amount: 2_000_000,
        }),
        transaction({
          id: "investment-sale",
          type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
          amount: 12_000_000,
        }),
        transaction({
          id: "investment-buy",
          type: TransactionLedgerType.INVESTMENT_BUY,
          amount: 10_000_000,
        }),
        transaction({
          id: "investment-fee",
          type: TransactionLedgerType.INVESTMENT_FEE,
          amount: 100_000,
        }),
      ],
    });
    expect(metrics.income).toBe(2_000_000);
    expect(metrics.expense).toBe(100_000);
    expect(metrics.netCashFlow).toBe(1_900_000);
  });
});
