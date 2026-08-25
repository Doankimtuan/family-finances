import { describe, expect, it } from "vitest";
import {
  createTransactionActivities,
  transactionActivityMatchesFilter,
  TransactionActivityKind,
  TransactionActivityTone,
  TransactionActivityBreakdownKind,
  type LedgerTransaction,
} from "@/modules/ledger/application";
import {
  TransactionFilterType,
  TransactionLedgerType,
  TransactionStatus,
  TRANSACTION_FILTER_OPTIONS,
} from "@/modules/ledger/application/ledger-constants";

function row(overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return {
    id: "transaction-id",
    accountId: "account-id",
    accountName: "Cash",
    type: TransactionLedgerType.EXPENSE,
    amount: 100,
    currency: "VND",
    transactionDate: "2026-08-14",
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
    createdAt: "2026-08-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("transaction filter semantics", () => {
  it("offers Transfer as a distinct activity filter", () => {
    expect(TRANSACTION_FILTER_OPTIONS).toContain(
      TransactionFilterType.TRANSFER,
    );
  });
});

describe("createTransactionActivities", () => {
  it("projects owned-account transfer legs as one neutral global activity", () => {
    const activities = createTransactionActivities([
      row({
        id: "out",
        accountId: "cash",
        accountName: "Cash",
        type: TransactionLedgerType.TRANSFER_OUT,
        transferGroupId: "transfer-1",
      }),
      row({
        id: "in",
        accountId: "wallet",
        accountName: "Wallet",
        type: TransactionLedgerType.TRANSFER_IN,
        transferGroupId: "transfer-1",
      }),
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      id: "transfer-1",
      kind: TransactionActivityKind.TRANSFER,
      tone: TransactionActivityTone.NEUTRAL,
      sourceAccount: { id: "cash", name: "Cash" },
      destinationAccount: { id: "wallet", name: "Wallet" },
      relatedTransactionIds: ["out", "in"],
    });
  });

  it("projects loan principal and interest rows as one payment activity", () => {
    const activities = createTransactionActivities([
      row({
        id: "principal",
        type: TransactionLedgerType.LIABILITY_PAYMENT,
        amount: 900,
        loanPaymentId: "payment-1",
      }),
      row({
        id: "interest",
        type: TransactionLedgerType.LOAN_INTEREST,
        amount: 100,
        loanPaymentId: "payment-1",
      }),
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      id: "payment-1",
      kind: TransactionActivityKind.LIABILITY_PAYMENT,
      tone: TransactionActivityTone.DEBIT,
      amount: 1_000,
      relatedTransactionIds: ["principal", "interest"],
      loanPaymentId: "payment-1",
      countsTowardIncome: false,
      countsTowardExpense: true,
      breakdown: {
        kind: TransactionActivityBreakdownKind.LOAN_PAYMENT,
        totalPaid: 1_000,
        principalAmount: 900,
        interestAmount: 100,
        expenseContribution: 100,
        neutralContribution: 900,
      },
    });
  });

  it.each([
    [
      TransactionLedgerType.DEBT_BORROWING,
      TransactionActivityKind.DEBT_BORROWING,
      TransactionActivityTone.NEUTRAL,
    ],
    [
      TransactionLedgerType.DEBT_LENDING,
      TransactionActivityKind.DEBT_LENDING,
      TransactionActivityTone.NEUTRAL,
    ],
    [
      TransactionLedgerType.LIABILITY_PAYMENT,
      TransactionActivityKind.LIABILITY_PAYMENT,
      TransactionActivityTone.NEUTRAL,
    ],
  ])(
    "does not classify %s as ordinary income or expense",
    (type, kind, tone) => {
      const [activity] = createTransactionActivities([row({ type })]);
      expect(activity).toMatchObject({ kind, tone });
    },
  );

  it("classifies reversal rows as refunds instead of ordinary income", () => {
    const [activity] = createTransactionActivities([
      row({
        type: TransactionLedgerType.INCOME,
        isReversal: true,
        reversesTransactionId: "expense-id",
      }),
    ]);
    expect(activity).toMatchObject({
      kind: TransactionActivityKind.REFUND,
      tone: TransactionActivityTone.REFUND,
    });
  });
});

describe("transactionActivityMatchesFilter", () => {
  it("uses canonical income and expense eligibility instead of cash direction", () => {
    const [refund] = createTransactionActivities([
      row({
        type: TransactionLedgerType.EXPENSE,
        isReversal: true,
        reversesTransactionId: "expense-id",
      }),
    ]);
    const [cardPayment] = createTransactionActivities([
      row({ type: TransactionLedgerType.LIABILITY_PAYMENT }),
    ]);

    expect(
      transactionActivityMatchesFilter(refund, TransactionFilterType.INCOME),
    ).toBe(false);
    expect(
      transactionActivityMatchesFilter(refund, TransactionFilterType.EXPENSE),
    ).toBe(false);
    expect(
      transactionActivityMatchesFilter(
        cardPayment,
        TransactionFilterType.EXPENSE,
      ),
    ).toBe(false);
  });

  it("includes mixed loan payments in Expense without making principal Expense", () => {
    const [payment] = createTransactionActivities([
      row({
        type: TransactionLedgerType.LIABILITY_PAYMENT,
        amount: 900,
        loanPaymentId: "payment-2",
      }),
      row({
        id: "interest-2",
        type: TransactionLedgerType.LOAN_INTEREST,
        amount: 100,
        loanPaymentId: "payment-2",
      }),
    ]);

    expect(
      transactionActivityMatchesFilter(payment, TransactionFilterType.EXPENSE),
    ).toBe(true);
    expect(payment.breakdown).toMatchObject({
      neutralContribution: 900,
      expenseContribution: 100,
    });
  });

  it("keeps savings movements out of the transfer filter", () => {
    const [savingsMovement] = createTransactionActivities([
      row({
        id: "savings-out",
        type: TransactionLedgerType.TRANSFER_OUT,
        transferGroupId: "savings-transfer",
        savingsEventKind: "SAVINGS_PRINCIPAL_PLACEMENT",
      }),
      row({
        id: "savings-in",
        type: TransactionLedgerType.TRANSFER_IN,
        transferGroupId: "savings-transfer",
        savingsEventKind: "SAVINGS_PRINCIPAL_PLACEMENT",
      }),
    ]);

    expect(
      transactionActivityMatchesFilter(
        savingsMovement,
        TransactionFilterType.TRANSFER,
      ),
    ).toBe(false);
  });
});
