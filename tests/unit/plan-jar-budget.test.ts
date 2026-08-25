import { describe, expect, it } from "vitest";
import {
  JarPlanKind,
  JarRolloverMode,
} from "@/modules/plan/application/jar-types";
import {
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  calculateJarBudgetAmount,
  calculateJarBudgetMetrics,
  calculateJarSpentAmount,
  calculatePeriodIncome,
} from "@/modules/plan/application/jar-budget";
import { calculateRolloverCreditFromPreviousState } from "@/modules/plan/application/jar-rollover";

const fixedJar = {
  plan: { kind: JarPlanKind.FIXED, percentBps: 0, fixedAmount: 15_000_000 },
  capacityDelta: 0,
};
const percentJar = {
  plan: { kind: JarPlanKind.PERCENT, percentBps: 5_000, fixedAmount: 0 },
  capacityDelta: 0,
};

describe("Plan V2 jar budgets", () => {
  it("uses fixed monthly amounts without requiring income", () => {
    expect(calculateJarBudgetAmount(fixedJar, 0)).toBe(15_000_000);
  });

  it("uses posted ordinary income as the percentage base", () => {
    expect(calculateJarBudgetAmount(percentJar, 20_000_000)).toBe(10_000_000);
    expect(
      calculatePeriodIncome([
        {
          type: TransactionLedgerType.INCOME,
          amount: 20_000_000,
          status: TransactionStatus.POSTED,
        },
        {
          type: TransactionLedgerType.INCOME,
          amount: 5_000_000,
          status: TransactionStatus.POSTED,
          isReversal: true,
        },
        {
          type: TransactionLedgerType.INVESTMENT_INCOME,
          amount: 3_000_000,
          status: TransactionStatus.POSTED,
        },
        {
          type: TransactionLedgerType.TRANSFER_IN,
          amount: 9_000_000,
          status: TransactionStatus.POSTED,
        },
        {
          type: TransactionLedgerType.INCOME,
          amount: 1_000_000,
          status: TransactionStatus.REVERSED,
        },
      ]),
    ).toBe(20_000_000);
  });

  it("keeps historical jar assignment and nets refund/reversal legs", () => {
    expect(
      calculateJarSpentAmount("jar-a", [
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 9_200_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
        {
          type: TransactionLedgerType.INCOME,
          amount: 1_200_000,
          status: TransactionStatus.POSTED,
          isReversal: true,
          jar_id: "jar-a",
        },
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 700_000,
          status: TransactionStatus.POSTED,
          isReversal: true,
          jar_id: "jar-a",
        },
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 5_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-b",
        },
        {
          type: TransactionLedgerType.LIABILITY_PAYMENT,
          amount: 2_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
        {
          type: TransactionLedgerType.TRANSFER_OUT,
          amount: 4_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
        {
          type: TransactionLedgerType.INVESTMENT_BUY,
          amount: 1_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
      ]),
    ).toBe(8_300_000);
  });

  it("counts credit-card expenses as spent", () => {
    expect(
      calculateJarSpentAmount("jar-a", [
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 500_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
      ]),
    ).toBe(500_000);
  });

  it("exposes negative remaining and 120% usage for overspending", () => {
    expect(
      calculateJarBudgetMetrics(fixedJar, "jar-a", [
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 18_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
      ]),
    ).toMatchObject({
      budgetAmount: 15_000_000,
      spentAmount: 18_000_000,
      remainingAmount: -3_000_000,
      usagePercent: 120,
      state: "overspent",
    });
  });

  it("applies rollover credit and period adjustment", () => {
    expect(
      calculateJarBudgetAmount(fixedJar, 0, {
        rolloverCredit: 1_000_000,
        adjustment: 500_000,
      }),
    ).toBe(16_500_000);
  });

  it("carries only positive unused budget and never creates first-period credit", () => {
    expect(
      calculateRolloverCreditFromPreviousState({
        rolloverMode: JarRolloverMode.RESET,
        previousBudget: 10,
        previousSpent: 8,
      }),
    ).toBe(0);
    expect(
      calculateRolloverCreditFromPreviousState({
        rolloverMode: JarRolloverMode.CARRY,
        previousBudget: 10,
        previousSpent: 8,
      }),
    ).toBe(2);
    expect(
      calculateRolloverCreditFromPreviousState({
        rolloverMode: JarRolloverMode.CARRY,
        previousBudget: 10,
        previousSpent: 12,
      }),
    ).toBe(0);
    expect(
      calculateRolloverCreditFromPreviousState({
        rolloverMode: JarRolloverMode.CARRY,
        previousBudget: 0,
        previousSpent: 0,
      }),
    ).toBe(0);
  });

  it("allows an explicit adjustment to recover an overspent jar", () => {
    const result = calculateJarBudgetMetrics(
      fixedJar,
      "jar-a",
      [
        {
          type: TransactionLedgerType.EXPENSE,
          amount: 18_000_000,
          status: TransactionStatus.POSTED,
          jar_id: "jar-a",
        },
      ],
      { adjustment: 3_000_000 },
    );

    expect(result).toMatchObject({
      remainingAmount: 0,
      usagePercent: 100,
      state: "near_limit",
    });
  });
});
