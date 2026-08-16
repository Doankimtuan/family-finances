import { describe, expect, it } from "vitest";
import { summarizeCashFlow } from "@/modules/plan/application/queries/get-monthly-review";
import {
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";

type ReviewRow = Parameters<typeof summarizeCashFlow>[0][number];

function row(type: string, amount: number, extras: Partial<ReviewRow> = {}): ReviewRow {
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
      row("transfer_out", 1_000_000, { savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT", transfer_group_id: "savings-1" }),
      row("transfer_in", 1_000_000, { savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT", transfer_group_id: "savings-1" }),
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
      row("transfer_out", 2_000_000, { savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT", transfer_group_id: "savings-2" }),
      row("transfer_in", 2_000_000, { savings_event_kind: "SAVINGS_PRINCIPAL_PLACEMENT", transfer_group_id: "savings-2" }),
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
