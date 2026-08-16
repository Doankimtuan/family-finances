import { describe, expect, it } from "vitest";
import {
  FinancialClassification,
  FinancialEventCategory,
  FinancialCashDirection,
  classifyFinancialEvent,
} from "@/modules/ledger/application";
import {
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  createTransactionActivities,
  TransactionActivityKind,
  TransactionActivityTone,
  type LedgerTransaction,
} from "@/modules/ledger/application";

function row(overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return {
    id: "tx",
    accountId: "account",
    accountName: "TPBank",
    type: TransactionLedgerType.EXPENSE,
    amount: 100,
    currency: "VND",
    transactionDate: "2026-08-16",
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
    createdAt: "2026-08-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("canonical financial semantics", () => {
  it.each([
    [
      TransactionLedgerType.INCOME,
      FinancialClassification.INCOME,
      true,
      false,
      "+",
    ],
    [
      TransactionLedgerType.EXPENSE,
      FinancialClassification.EXPENSE,
      false,
      true,
      "−",
    ],
    [
      TransactionLedgerType.INVESTMENT_BUY,
      FinancialClassification.NON_EXPENSE_OUTFLOW,
      false,
      false,
      "−",
    ],
    [
      TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
      FinancialClassification.NON_INCOME_INFLOW,
      false,
      false,
      "+",
    ],
    [
      TransactionLedgerType.DEBT_BORROWING,
      FinancialClassification.NON_INCOME_INFLOW,
      false,
      false,
      "+",
    ],
    [
      TransactionLedgerType.DEBT_LENDING,
      FinancialClassification.NON_EXPENSE_OUTFLOW,
      false,
      false,
      "−",
    ],
    [
      TransactionLedgerType.LIABILITY_PAYMENT,
      FinancialClassification.NON_EXPENSE_OUTFLOW,
      false,
      false,
      "−",
    ],
    [
      TransactionLedgerType.INVESTMENT_INCOME,
      FinancialClassification.INCOME,
      true,
      false,
      "+",
    ],
  ] as const)(
    "classifies %s independently of its cash sign",
    (type, classification, income, expense, sign) => {
      const semantics = classifyFinancialEvent({ type });
      expect(semantics).toMatchObject({
        classification,
        countsTowardIncome: income,
        countsTowardExpense: expense,
        sign,
      });
    },
  );

  it("keeps savings principal neutral while preserving directional cash", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.TRANSFER_OUT,
        savingsEventKind: "SAVINGS_PRINCIPAL_PLACEMENT",
      }),
    ).toMatchObject({
      category: FinancialEventCategory.SAVINGS,
      classification: FinancialClassification.TRANSFER,
      cashDirection: FinancialCashDirection.OUTFLOW,
      countsTowardIncome: false,
      countsTowardExpense: false,
      sign: "−",
    });
  });

  it("groups savings legs into one directional activity", () => {
    const [activity] = createTransactionActivities([
      row({
        id: "saving-out",
        type: TransactionLedgerType.TRANSFER_OUT,
        amount: 20_000_000,
        transferGroupId: "saving-1",
        savingsEventKind: "SAVINGS_PRINCIPAL_PLACEMENT",
      }),
      row({
        id: "saving-in",
        accountId: "savings-product",
        accountName: "Savings",
        type: TransactionLedgerType.TRANSFER_IN,
        amount: 20_000_000,
        transferGroupId: "saving-1",
        savingsEventKind: "SAVINGS_PRINCIPAL_PLACEMENT",
      }),
    ]);
    expect(activity).toMatchObject({
      kind: TransactionActivityKind.SAVINGS,
      tone: TransactionActivityTone.DEBIT,
      sign: "−",
      countsTowardIncome: false,
      countsTowardExpense: false,
      relatedTransactionIds: ["saving-out", "saving-in"],
    });
  });

  it("renders investment sell as a credit without ordinary Income", () => {
    const [activity] = createTransactionActivities([
      row({
        type: TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
        amount: 12_000_000,
      }),
    ]);
    expect(activity).toMatchObject({
      kind: TransactionActivityKind.INVESTMENT,
      tone: TransactionActivityTone.CREDIT,
      sign: "+",
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
  });
});
