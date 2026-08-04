import {
  TransactionDirection,
  type TransactionDirection as TransactionDirectionValue,
} from "./ledger-constants";

export type IncomeCountableRow = {
  type: string;
  amount: number | string;
  isReversal?: boolean | null;
  reversesTransactionId?: string | null;
};

/**
 * Refund / correction-reversal legs restore cash and jar capacity but must not
 * inflate monthly income (BR-02 / REQ-JAR-01 / refund lifecycle S2).
 */
export function countsTowardMonthlyIncome(row: IncomeCountableRow): boolean {
  if (row.type !== TransactionDirection.INCOME) {
    return false;
  }
  if (row.isReversal) {
    return false;
  }
  if (row.reversesTransactionId) {
    return false;
  }
  return true;
}

export function coerceAmount(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return Number.isFinite(value) ? value : 0;
}

/** Sum of income that counts toward monthly income reporting (excludes reversals). */
export function sumMonthlyIncome(rows: IncomeCountableRow[]): number {
  return rows.reduce((sum, row) => {
    if (!countsTowardMonthlyIncome(row)) {
      return sum;
    }
    return sum + coerceAmount(row.amount);
  }, 0);
}

/**
 * Jar capacity delta for a ledger leg on a mapped jar.
 * Expense reduces capacity; income (including is_reversal refunds) restores it.
 */
export function jarCapacityDelta(row: {
  type: string;
  amount: number | string;
  jarId?: string | null;
}): number {
  if (!row.jarId) {
    return 0;
  }
  const amount = coerceAmount(row.amount);
  if (row.type === TransactionDirection.EXPENSE) {
    return -amount;
  }
  if (row.type === TransactionDirection.INCOME) {
    return amount;
  }
  return 0;
}

export function sumJarCapacity(
  rows: Array<{
    type: string;
    amount: number | string;
    jarId?: string | null;
  }>,
): number {
  return rows.reduce((sum, row) => sum + jarCapacityDelta(row), 0);
}

export function isIncomeDirection(
  type: string,
): type is typeof TransactionDirection.INCOME {
  return type === TransactionDirection.INCOME;
}

export type { TransactionDirectionValue };
