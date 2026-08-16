import { describe, expect, it } from "vitest";
import { calculateHomeFinancialMetrics } from "@/modules/home/application";
import { HomeDashboardPeriod } from "@/modules/home/application/home-constants";
import { summarizeCashFlow } from "@/modules/plan/application/queries/get-monthly-review";
import {
  TransactionLedgerType,
  TransactionStatus,
  type LedgerTransaction,
} from "@/modules/ledger/application";

type ReviewRow = Parameters<typeof summarizeCashFlow>[0][number];

type ClassifiedEvent = {
  id: string;
  type: TransactionLedgerType;
  amount: number;
  status?: string;
  isReversal?: boolean;
  reversesTransactionId?: string | null;
};

function toHomeTransaction(event: ClassifiedEvent): LedgerTransaction {
  return {
    id: event.id,
    accountId: "account-id",
    type: event.type,
    amount: event.amount,
    currency: "VND",
    transactionDate: "2026-08-12",
    note: null,
    categoryId: null,
    categoryName: null,
    jarId: null,
    jarName: null,
    status: event.status ?? TransactionStatus.POSTED,
    transferGroupId: null,
    reversesTransactionId: event.reversesTransactionId ?? null,
    correctsTransactionId: null,
    isReversal: event.isReversal ?? false,
    createdAt: "2026-08-12T12:00:00.000Z",
  };
}

function toReviewRow(event: ClassifiedEvent): ReviewRow {
  return {
    id: event.id,
    type: event.type,
    amount: event.amount,
    status: event.status ?? TransactionStatus.POSTED,
    transaction_date: "2026-08-12",
    created_at: "2026-08-12T12:00:00.000Z",
    transfer_group_id: null,
    savings_event_kind: null,
    is_reversal: event.isReversal ?? false,
    reverses_transaction_id: event.reversesTransactionId ?? null,
    jar_id: null,
    category_id: "category",
  };
}

const range = {
  period: HomeDashboardPeriod.MONTH,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  previousStartDate: "2026-07-01",
  previousEndDate: "2026-07-31",
};

const transactionStates = [
  {
    name: "normal income",
    event: { id: "income", type: TransactionLedgerType.INCOME, amount: 10_000_000 },
    income: 10_000_000,
    expense: 0,
  },
  {
    name: "normal expense",
    event: { id: "expense", type: TransactionLedgerType.EXPENSE, amount: 3_000_000 },
    income: 0,
    expense: 3_000_000,
  },
  {
    name: "reversed expense original",
    event: {
      id: "reversed-expense",
      type: TransactionLedgerType.EXPENSE,
      amount: 4_000_000,
      status: TransactionStatus.REVERSED,
    },
    income: 0,
    expense: 0,
  },
  {
    name: "reversed income original",
    event: {
      id: "reversed-income",
      type: TransactionLedgerType.INCOME,
      amount: 9_000_000,
      status: TransactionStatus.REVERSED,
    },
    income: 0,
    expense: 0,
  },
  {
    name: "reversal leg refunding an expense",
    event: {
      id: "reversal-leg",
      type: TransactionLedgerType.INCOME,
      amount: 700_000,
      isReversal: true,
      reversesTransactionId: "reversed-expense",
    },
    income: 0,
    expense: 0,
  },
  {
    name: "non-countable inflow (investment sale proceeds)",
    event: {
      id: "sell-proceeds",
      type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
      amount: 12_000_000,
    },
    income: 0,
    expense: 0,
  },
  {
    name: "non-countable outflow (owned-account transfer)",
    event: {
      id: "transfer-out",
      type: TransactionLedgerType.TRANSFER_OUT,
      amount: 2_000_000,
    },
    income: 0,
    expense: 0,
  },
] as const;

describe("cross-screen financial classification consistency", () => {
  it.each(transactionStates)(
    "classifies a $name identically on Home and Monthly Review",
    ({ event, income, expense }) => {
      const metrics = calculateHomeFinancialMetrics({
        range,
        transactions: [toHomeTransaction(event)],
      });
      const summary = summarizeCashFlow([toReviewRow(event)]);

      expect(metrics.income).toBe(income);
      expect(summary.income).toBe(income);
      expect(metrics.expense).toBe(expense);
      expect(summary.expenses).toBe(expense);
    },
  );

  it("reports the same combined totals when every state occurs in one month", () => {
    const events = transactionStates.map(({ event }) => event);
    const metrics = calculateHomeFinancialMetrics({
      range,
      transactions: events.map(toHomeTransaction),
    });
    const summary = summarizeCashFlow(events.map(toReviewRow));

    expect(metrics.income).toBe(10_000_000);
    expect(summary.income).toBe(10_000_000);
    expect(metrics.expense).toBe(3_000_000);
    expect(summary.expenses).toBe(3_000_000);
  });
});
