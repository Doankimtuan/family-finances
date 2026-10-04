import type { TransactionActivity } from "./transaction-activity";
import { TransactionActivityBreakdownKind } from "./transaction-constants";

/** Totals for a complete effective-date group, separated by currency. */
export function summarizeTransactionActivities(
  activities: readonly TransactionActivity[],
) {
  const totals = new Map<
    string,
    { currency: string; income: number; expense: number }
  >();
  for (const activity of activities) {
    const total = totals.get(activity.currency) ?? {
      currency: activity.currency,
      income: 0,
      expense: 0,
    };
    if (activity.countsTowardIncome) total.income += activity.amount;
    if (activity.countsTowardExpense) {
      total.expense +=
        activity.breakdown.kind ===
        TransactionActivityBreakdownKind.LOAN_PAYMENT
          ? activity.breakdown.expenseContribution
          : activity.amount;
    }
    totals.set(activity.currency, total);
  }
  return [...totals.values()];
}
