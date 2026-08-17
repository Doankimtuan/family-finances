import {
  TransactionLedgerType,
  TransactionStatus,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "./ledger-constants";

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
  status?: string | null;
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

const SAVINGS_EVENT_PREFIX = "SAVINGS_";

const DEFAULT_EVENT_SEMANTICS: FinancialEventSemantics = {
  category: FinancialEventCategory.OTHER,
  classification: FinancialClassification.OTHER,
  cashDirection: FinancialCashDirection.NEUTRAL,
  countsTowardIncome: false,
  countsTowardExpense: false,
  sign: "",
};

const REVERSAL_CASH_DIRECTION_BY_LEDGER_TYPE: Partial<
  Record<string, FinancialCashDirection>
> = {
  [TransactionLedgerType.EXPENSE]: FinancialCashDirection.INFLOW,
  [TransactionLedgerType.INCOME]: FinancialCashDirection.OUTFLOW,
};

const LEDGER_TYPE_EVENT_SEMANTICS: Partial<
  Record<TransactionLedgerTypeValue, FinancialEventSemantics>
> = {
  [TransactionLedgerType.INCOME]: {
    category: FinancialEventCategory.INCOME,
    classification: FinancialClassification.INCOME,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: true,
    countsTowardExpense: false,
    sign: "+",
  },
  [TransactionLedgerType.EXPENSE]: {
    category: FinancialEventCategory.EXPENSE,
    classification: FinancialClassification.EXPENSE,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: true,
    sign: "−",
  },
  [TransactionLedgerType.INVESTMENT_INCOME]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.INCOME,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: true,
    countsTowardExpense: false,
    sign: "+",
  },
  [TransactionLedgerType.INVESTMENT_FEE]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.EXPENSE,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: true,
    sign: "−",
  },
  [TransactionLedgerType.INVESTMENT_BUY]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
  },
  [TransactionLedgerType.INVESTMENT_SELL_PROCEEDS]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
  },
  [TransactionLedgerType.DEBT_BORROWING]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
  },
  [TransactionLedgerType.DEBT_LENDING]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
  },
  [TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
  },
  [TransactionLedgerType.LIABILITY_PAYMENT]: {
    category: FinancialEventCategory.LIABILITY,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
  },
};

function savingsCategory(row: FinancialSemanticRow): boolean {
  return row.savingsEventKind?.toUpperCase().startsWith(SAVINGS_EVENT_PREFIX) ?? false;
}

function cashDirectionSign(
  direction: FinancialCashDirection,
): FinancialEventSemantics["sign"] {
  if (direction === FinancialCashDirection.INFLOW) return "+";
  if (direction === FinancialCashDirection.OUTFLOW) return "−";
  return "";
}

function classifyReversalSemantics(type: string): FinancialEventSemantics {
  const cashDirection =
    REVERSAL_CASH_DIRECTION_BY_LEDGER_TYPE[type] ??
    FinancialCashDirection.NEUTRAL;
  return {
    category: FinancialEventCategory.REFUND,
    classification: FinancialClassification.REFUND,
    cashDirection,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: cashDirectionSign(cashDirection),
  };
}

function transferLegSemantics(
  row: FinancialSemanticRow,
  type: TransactionLedgerTypeValue,
): FinancialEventSemantics {
  const cashDirection =
    type === TransactionLedgerType.TRANSFER_IN
      ? FinancialCashDirection.INFLOW
      : FinancialCashDirection.OUTFLOW;
  return {
    category: savingsCategory(row)
      ? FinancialEventCategory.SAVINGS
      : FinancialEventCategory.TRANSFER,
    classification: FinancialClassification.TRANSFER,
    cashDirection,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: cashDirectionSign(cashDirection),
  };
}

/**
 * Canonical classification for one ledger row, shared by every reporting
 * surface (Home dashboard, Monthly Review, jar budgets). A `reversed` original
 * keeps its type-based cash semantics — BR-03 keeps it in balance math so the
 * reversal leg can offset it — but never counts toward monthly income or
 * expense totals.
 */
export function classifyFinancialEvent(
  row: FinancialSemanticRow,
): FinancialEventSemantics {
  const semantics = classifyEventSemantics(row);
  if (row.status !== TransactionStatus.REVERSED) return semantics;
  return {
    ...semantics,
    countsTowardIncome: false,
    countsTowardExpense: false,
  };
}

function classifyEventSemantics(
  row: FinancialSemanticRow,
): FinancialEventSemantics {
  const reversed = Boolean(row.isReversal || row.reversesTransactionId);
  const type = row.type;

  if (reversed) {
    return classifyReversalSemantics(type);
  }

  if (
    type === TransactionLedgerType.TRANSFER_OUT ||
    type === TransactionLedgerType.TRANSFER_IN
  ) {
    return transferLegSemantics(row, type);
  }

  return (
    LEDGER_TYPE_EVENT_SEMANTICS[type as TransactionLedgerTypeValue] ??
    DEFAULT_EVENT_SEMANTICS
  );
}

export function countsTowardMonthlyIncome(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardIncome;
}

export function countsTowardMonthlyExpense(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardExpense;
}
