import { describe, expect, it } from "vitest";
import {
  createTransactionActivities,
  TransactionActivityKind,
  TransactionActivityTone,
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

  it.each([
    [
      TransactionLedgerType.DEBT_BORROWING,
      TransactionActivityKind.DEBT_BORROWING,
      TransactionActivityTone.CREDIT,
    ],
    [
      TransactionLedgerType.DEBT_LENDING,
      TransactionActivityKind.DEBT_LENDING,
      TransactionActivityTone.DEBIT,
    ],
    [
      TransactionLedgerType.LIABILITY_PAYMENT,
      TransactionActivityKind.LIABILITY_PAYMENT,
      TransactionActivityTone.DEBIT,
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
    expect(activity.kind).toBe(TransactionActivityKind.REFUND);
  });
});
