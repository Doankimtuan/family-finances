import {
  TransactionDirection,
  type TransactionDirection as TransactionDirectionValue,
} from "./ledger-constants";
import {
  countsTowardMonthlyExpense as classifyExpense,
  countsTowardMonthlyIncome as classifyIncome,
  type FinancialSemanticRow,
} from "./financial-semantics";

export type IncomeCountableRow = FinancialSemanticRow & {
  amount: number | string;
};

/**
 * Earned-income policy shared by Home and reporting selectors. Principal
 * returns, borrowing, transfers, investment sale proceeds, refunds, and
 * reversed originals/reversal legs are deliberately excluded even when they
 * increase cash.
 */
export function countsTowardMonthlyIncome(row: IncomeCountableRow): boolean {
  return classifyIncome(row);
}

export function countsTowardMonthlyExpense(row: IncomeCountableRow): boolean {
  return classifyExpense(row);
}

export function coerceAmount(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return Number.isFinite(value) ? value : 0;
}

/** Sum of earned income, excluding principal, reversed originals, and reversal legs. */
export function sumMonthlyIncome(rows: IncomeCountableRow[]): number {
  return rows.reduce((sum, row) => {
    if (!countsTowardMonthlyIncome(row)) return sum;
    return sum + coerceAmount(row.amount);
  }, 0);
}

export function sumMonthlyExpense(rows: IncomeCountableRow[]): number {
  return rows.reduce((sum, row) => {
    if (!countsTowardMonthlyExpense(row)) return sum;
    return sum + coerceAmount(row.amount);
  }, 0);
}

/**
 * Jar capacity delta for a ledger leg on a mapped jar.
 * Expense reduces capacity; income (including reversal refunds) restores it.
 */
export function jarCapacityDelta(row: {
  type: string;
  amount: number | string;
  jarId?: string | null;
}): number {
  if (!row.jarId) return 0;
  const amount = coerceAmount(row.amount);
  if (row.type === TransactionDirection.EXPENSE) return -amount;
  if (row.type === TransactionDirection.INCOME) return amount;
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
