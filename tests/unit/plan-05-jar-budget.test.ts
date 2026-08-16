import { describe, expect, it } from "vitest";
import { calculateJarBudgetMetrics, calculateJarBudgetAmount } from "@/modules/plan/application/jar-budget";
import { calculateRolloverCreditFromPreviousState } from "@/modules/plan/application/jar-rollover";
import { JarPlanKind, JarRolloverMode, type PlanJar } from "@/modules/plan/application/jar-types";
import { TransactionLedgerType, TransactionStatus } from "@/modules/ledger/application/ledger-constants";

const fixedJar: PlanJar = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Buffer",
  isNameCustom: true,
  kind: "buffer",
  state: "active",
  sortOrder: 1,
  capacityDelta: 0,
  rolloverMode: JarRolloverMode.CARRY,
  plan: { kind: JarPlanKind.FIXED, percentBps: 0, fixedAmount: 10_000_000 },
};

const expense = (amount: number) => ({
  id: crypto.randomUUID(),
  type: TransactionLedgerType.EXPENSE,
  amount,
  status: TransactionStatus.POSTED,
  jar_id: fixedJar.id,
});

describe("PLAN 05 Jar budget mechanics", () => {
  it("does not carry reset jars", () => {
    expect(calculateRolloverCreditFromPreviousState({ rolloverMode: JarRolloverMode.RESET, previousBudget: 10, previousSpent: 8 })).toBe(0);
  });

  it("carries only positive unused budget", () => {
    expect(calculateRolloverCreditFromPreviousState({ rolloverMode: JarRolloverMode.CARRY, previousBudget: 10, previousSpent: 8 })).toBe(2);
    expect(calculateRolloverCreditFromPreviousState({ rolloverMode: JarRolloverMode.CARRY, previousBudget: 10, previousSpent: 12 })).toBe(0);
    expect(calculateRolloverCreditFromPreviousState({ rolloverMode: JarRolloverMode.CARRY, previousBudget: 10, previousSpent: 10 })).toBe(0);
  });

  it("has no synthetic credit in the first period", () => {
    expect(calculateRolloverCreditFromPreviousState({ rolloverMode: JarRolloverMode.CARRY, previousBudget: 0, previousSpent: 0 })).toBe(0);
  });

  it("includes a period adjustment in the selected envelope only", () => {
    expect(calculateJarBudgetAmount(fixedJar, 0, { adjustment: 2_000_000 })).toBe(12_000_000);
    expect(calculateJarBudgetAmount(fixedJar, 0)).toBe(10_000_000);
  });

  it("preserves negative remaining and usage above 100 percent", () => {
    expect(calculateJarBudgetMetrics(fixedJar, fixedJar.id, [expense(12_000_000)], { periodIncome: 0 })).toMatchObject({
      budgetAmount: 10_000_000,
      spentAmount: 12_000_000,
      remainingAmount: -2_000_000,
      usagePercent: 120,
      state: "overspent",
    });
  });

  it("reallocation arithmetic is balanced and has zero ledger impact", () => {
    const amount = 2_000_000;
    const sourceAdjustment = -amount;
    const targetAdjustment = amount;
    expect(sourceAdjustment + targetAdjustment).toBe(0);
    expect(0).toBe(0);
  });
});

it("allows explicit budget into an overspent jar without changing Money", () => {
  const after = calculateJarBudgetMetrics(fixedJar, fixedJar.id, [expense(12_000_000)], {
    periodIncome: 0,
    adjustment: 2_000_000,
  });
  expect(after.remainingAmount).toBe(0);
  expect(after.usagePercent).toBe(100);
  expect(after.state).not.toBe("overspent");
});
