import { TransactionLedgerType } from "./ledger-constants";

export const FinancialEventCategory = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  SAVINGS: "savings",
  INVESTMENT: "investment",
  DEBT: "debt",
  LIABILITY: "liability",
  REFUND: "refund",
  OTHER: "other",
} as const;
export type FinancialEventCategory =
  (typeof FinancialEventCategory)[keyof typeof FinancialEventCategory];

export const FinancialClassification = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  NON_INCOME_INFLOW: "non_income_inflow",
  NON_EXPENSE_OUTFLOW: "non_expense_outflow",
  REFUND: "refund",
  OTHER: "other",
} as const;
export type FinancialClassification =
  (typeof FinancialClassification)[keyof typeof FinancialClassification];

export const FinancialCashDirection = {
  INFLOW: "inflow",
  OUTFLOW: "outflow",
  NEUTRAL: "neutral",
} as const;
export type FinancialCashDirection =
  (typeof FinancialCashDirection)[keyof typeof FinancialCashDirection];

export type FinancialSemanticRow = {
  type: string;
  isReversal?: boolean | null;
  reversesTransactionId?: string | null;
  savingsEventKind?: string | null;
};

export type FinancialEventSemantics = {
  category: FinancialEventCategory;
  classification: FinancialClassification;
  cashDirection: FinancialCashDirection;
  countsTowardIncome: boolean;
  countsTowardExpense: boolean;
  sign: "+" | "−" | "";
};

function savingsCategory(row: FinancialSemanticRow): boolean {
  return row.savingsEventKind?.toUpperCase().startsWith("SAVINGS_") ?? false;
}

export function classifyFinancialEvent(
  row: FinancialSemanticRow,
): FinancialEventSemantics {
  const reversed = Boolean(row.isReversal || row.reversesTransactionId);
  const type = row.type;

  if (reversed) {
    const cashDirection =
      type === TransactionLedgerType.EXPENSE
        ? FinancialCashDirection.INFLOW
        : type === TransactionLedgerType.INCOME
          ? FinancialCashDirection.OUTFLOW
          : FinancialCashDirection.NEUTRAL;
    return {
      category: FinancialEventCategory.REFUND,
      classification: FinancialClassification.REFUND,
      cashDirection,
      countsTowardIncome: false,
      countsTowardExpense: false,
      sign:
        cashDirection === FinancialCashDirection.INFLOW
          ? "+"
          : cashDirection === FinancialCashDirection.OUTFLOW
            ? "−"
            : "",
    };
  }

  switch (type) {
    case TransactionLedgerType.INCOME:
      return {
        category: FinancialEventCategory.INCOME,
        classification: FinancialClassification.INCOME,
        cashDirection: FinancialCashDirection.INFLOW,
        countsTowardIncome: true,
        countsTowardExpense: false,
        sign: "+",
      };
    case TransactionLedgerType.EXPENSE:
      return {
        category: FinancialEventCategory.EXPENSE,
        classification: FinancialClassification.EXPENSE,
        cashDirection: FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: true,
        sign: "−",
      };
    case TransactionLedgerType.INVESTMENT_INCOME:
      return {
        category: FinancialEventCategory.INVESTMENT,
        classification: FinancialClassification.INCOME,
        cashDirection: FinancialCashDirection.INFLOW,
        countsTowardIncome: true,
        countsTowardExpense: false,
        sign: "+",
      };
    case TransactionLedgerType.INVESTMENT_FEE:
      return {
        category: FinancialEventCategory.INVESTMENT,
        classification: FinancialClassification.EXPENSE,
        cashDirection: FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: true,
        sign: "−",
      };
    case TransactionLedgerType.INVESTMENT_BUY:
      return {
        category: FinancialEventCategory.INVESTMENT,
        classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
        cashDirection: FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "−",
      };
    case TransactionLedgerType.INVESTMENT_SELL_PROCEEDS:
      return {
        category: FinancialEventCategory.INVESTMENT,
        classification: FinancialClassification.NON_INCOME_INFLOW,
        cashDirection: FinancialCashDirection.INFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "+",
      };
    case TransactionLedgerType.DEBT_BORROWING:
      return {
        category: FinancialEventCategory.DEBT,
        classification: FinancialClassification.NON_INCOME_INFLOW,
        cashDirection: FinancialCashDirection.INFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "+",
      };
    case TransactionLedgerType.DEBT_LENDING:
      return {
        category: FinancialEventCategory.DEBT,
        classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
        cashDirection: FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "−",
      };
    case TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT:
      return {
        category: FinancialEventCategory.DEBT,
        classification: FinancialClassification.NON_INCOME_INFLOW,
        cashDirection: FinancialCashDirection.INFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "+",
      };
    case TransactionLedgerType.LIABILITY_PAYMENT:
      return {
        category: FinancialEventCategory.LIABILITY,
        classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
        cashDirection: FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "−",
      };
    case TransactionLedgerType.TRANSFER_OUT:
    case TransactionLedgerType.TRANSFER_IN:
      return {
        category: savingsCategory(row)
          ? FinancialEventCategory.SAVINGS
          : FinancialEventCategory.TRANSFER,
        classification: FinancialClassification.TRANSFER,
        cashDirection:
          type === TransactionLedgerType.TRANSFER_IN
            ? FinancialCashDirection.INFLOW
            : FinancialCashDirection.OUTFLOW,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: type === TransactionLedgerType.TRANSFER_IN ? "+" : "−",
      };
    default:
      return {
        category: FinancialEventCategory.OTHER,
        classification: FinancialClassification.OTHER,
        cashDirection: FinancialCashDirection.NEUTRAL,
        countsTowardIncome: false,
        countsTowardExpense: false,
        sign: "",
      };
  }
}

export function countsTowardMonthlyIncome(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardIncome;
}

export function countsTowardMonthlyExpense(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardExpense;
}
