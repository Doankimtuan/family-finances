import { describe, expect, it } from "vitest";
import {
  FinancialClassification,
  FinancialEventCategory,
  FinancialCashDirection,
  classifyFinancialEvent,
  getTransactionActionCapabilities,
  TransactionOwner,
} from "@/modules/ledger/application";
import {
  TransactionLedgerType,
  TRANSACTION_LEDGER_TYPE_VALUES,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  createTransactionActivities,
  TransactionActivityKind,
  TransactionActivityTone,
  type LedgerTransaction,
} from "@/modules/ledger/application";
import { todayIsoDate } from "@/shared/utils/iso-date";

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
    loanPaymentId: null,
    reversesTransactionId: null,
    correctsTransactionId: null,
    isReversal: false,
    createdAt: "2026-08-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("canonical financial semantics", () => {
  it.each(TRANSACTION_LEDGER_TYPE_VALUES)(
    "has complete capability semantics for %s",
    (type) => {
      const semantics = classifyFinancialEvent({ type });
      expect(semantics.owner).toBeDefined();
      expect(semantics.displayDirection).toBeDefined();
      expect(semantics.homeNetContribution).toBeDefined();
      expect(getTransactionActionCapabilities({ type })).toEqual({
        owner: semantics.owner,
        canGenericCorrect: semantics.canGenericCorrect,
        canGenericRefund: semantics.canGenericRefund,
      });
    },
  );

  it("uses the household-local date at a UTC boundary", () => {
    expect(todayIsoDate(new Date("2026-08-19T17:30:00.000Z"))).toBe(
      "2026-08-20",
    );
  });

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
      tone: TransactionActivityTone.NEUTRAL,
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
      tone: TransactionActivityTone.NEUTRAL,
      sign: "+",
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
  });
});

describe("reversed transaction states", () => {
  it("keeps a reversed expense original's cash semantics but stops it counting toward totals", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.EXPENSE,
        status: TransactionStatus.REVERSED,
      }),
    ).toMatchObject({
      classification: FinancialClassification.EXPENSE,
      cashDirection: FinancialCashDirection.OUTFLOW,
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
  });

  it("keeps a reversed income original's cash semantics but stops it counting toward totals", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.INCOME,
        status: TransactionStatus.REVERSED,
      }),
    ).toMatchObject({
      classification: FinancialClassification.INCOME,
      cashDirection: FinancialCashDirection.INFLOW,
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
  });

  it("classifies a reversal leg as a refund that never counts toward totals", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.INCOME,
        isReversal: true,
        reversesTransactionId: "expense-original",
      }),
    ).toMatchObject({
      category: FinancialEventCategory.REFUND,
      classification: FinancialClassification.REFUND,
      cashDirection: FinancialCashDirection.INFLOW,
      sign: "+",
      countsTowardIncome: false,
      countsTowardExpense: false,
    });
  });

  it("shows an expense reversal as an outflow", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.EXPENSE,
        isReversal: true,
        reversesTransactionId: "income-original",
      }),
    ).toMatchObject({
      cashDirection: FinancialCashDirection.OUTFLOW,
      sign: "−",
    });
  });

  it("keeps correction legs as ordinary ledger movements", () => {
    expect(
      classifyFinancialEvent({
        type: TransactionLedgerType.EXPENSE,
        correctsTransactionId: "expense-original",
      }),
    ).toMatchObject({
      category: FinancialEventCategory.EXPENSE,
      classification: FinancialClassification.EXPENSE,
      cashDirection: FinancialCashDirection.OUTFLOW,
      sign: "−",
      countsTowardExpense: true,
    });
  });

  it("still counts non-reversed statuses toward monthly totals", () => {
    for (const status of [
      TransactionStatus.POSTED,
      TransactionStatus.PENDING_MAPPING,
      TransactionStatus.PARTIALLY_REFUNDED,
      TransactionStatus.FULLY_REFUNDED,
    ]) {
      expect(
        classifyFinancialEvent({
          type: TransactionLedgerType.EXPENSE,
          status,
        }),
      ).toMatchObject({
        countsTowardIncome: false,
        countsTowardExpense: true,
      });
    }
  });

  it.each([
    [TransactionLedgerType.INCOME, TransactionOwner.LEDGER, true, false],
    [TransactionLedgerType.EXPENSE, TransactionOwner.LEDGER, true, true],
    [
      TransactionLedgerType.TRANSFER_OUT,
      TransactionOwner.TRANSFER,
      false,
      false,
    ],
    [
      TransactionLedgerType.LIABILITY_PAYMENT,
      TransactionOwner.LOAN,
      false,
      false,
    ],
    [
      TransactionLedgerType.INVESTMENT_BUY,
      TransactionOwner.INVESTMENT,
      false,
      false,
    ],
    [
      TransactionLedgerType.INVESTMENT_FEE,
      TransactionOwner.INVESTMENT,
      false,
      false,
    ],
  ] as const)(
    "exposes owner-scoped generic action eligibility for %s",
    (type, owner, canCorrect, canRefund) => {
      expect(getTransactionActionCapabilities({ type })).toMatchObject({
        owner,
        canGenericCorrect: canCorrect,
        canGenericRefund: canRefund,
      });
    },
  );

  it("blocks ordinary actions for a credit-card expense and savings event", () => {
    expect(
      getTransactionActionCapabilities({
        type: TransactionLedgerType.EXPENSE,
        accountType: "credit_card",
      }),
    ).toMatchObject({
      owner: TransactionOwner.CREDIT_CARD,
      canGenericCorrect: false,
      canGenericRefund: false,
    });
    expect(
      getTransactionActionCapabilities({
        type: TransactionLedgerType.EXPENSE,
        savingsEventKind: "SAVINGS_INTEREST",
      }),
    ).toMatchObject({
      owner: TransactionOwner.SAVINGS,
      canGenericCorrect: false,
      canGenericRefund: false,
    });
  });

  it("classifies loan interest as an expense with outgoing direction", () => {
    expect(
      classifyFinancialEvent({ type: TransactionLedgerType.LOAN_INTEREST }),
    ).toMatchObject({
      classification: FinancialClassification.EXPENSE,
      countsTowardExpense: true,
      cashDirection: FinancialCashDirection.OUTFLOW,
      sign: "−",
      owner: TransactionOwner.LOAN,
    });
  });
});
