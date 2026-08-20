import {
  AccountType,
  TransactionLedgerType,
  TransactionStatus,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "./ledger-constants";

export const TransactionOwner = {
  LEDGER: "ledger",
  TRANSFER: "transfer",
  CREDIT_CARD: "credit_card",
  DEBT: "debt",
  LOAN: "loan",
  SAVINGS: "savings",
  INVESTMENT: "investment",
} as const;
export type TransactionOwner =
  (typeof TransactionOwner)[keyof typeof TransactionOwner];

export const FinancialDisplayDirection = {
  INCOMING: "incoming",
  OUTGOING: "outgoing",
  NEUTRAL: "neutral",
  REFUND: "refund",
} as const;
export type FinancialDisplayDirection =
  (typeof FinancialDisplayDirection)[keyof typeof FinancialDisplayDirection];

export const FinancialHomeNetContribution = {
  INCOME: "income",
  EXPENSE: "expense",
  NEUTRAL: "neutral",
} as const;
export type FinancialHomeNetContribution =
  (typeof FinancialHomeNetContribution)[keyof typeof FinancialHomeNetContribution];

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
  accountType?: string | null;
  status?: string | null;
  isReversal?: boolean | null;
  reversesTransactionId?: string | null;
  correctsTransactionId?: string | null;
  savingsEventKind?: string | null;
};

export type FinancialEventSemantics = {
  category: FinancialEventCategory;
  classification: FinancialClassification;
  cashDirection: FinancialCashDirection;
  countsTowardIncome: boolean;
  countsTowardExpense: boolean;
  sign: "+" | "−" | "";
  displayDirection: FinancialDisplayDirection;
  owner: TransactionOwner;
  countsTowardSpending: boolean;
  homeNetContribution: FinancialHomeNetContribution;
  canGenericCorrect: boolean;
  canGenericRefund: boolean;
};

const SAVINGS_EVENT_PREFIX = "SAVINGS_";

const DEFAULT_EVENT_SEMANTICS: FinancialEventSemantics = {
  category: FinancialEventCategory.OTHER,
  classification: FinancialClassification.OTHER,
  cashDirection: FinancialCashDirection.NEUTRAL,
  countsTowardIncome: false,
  countsTowardExpense: false,
  sign: "",
  displayDirection: FinancialDisplayDirection.NEUTRAL,
  owner: TransactionOwner.LEDGER,
  countsTowardSpending: false,
  homeNetContribution: "neutral",
  canGenericCorrect: false,
  canGenericRefund: false,
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
    displayDirection: FinancialDisplayDirection.INCOMING,
    owner: TransactionOwner.LEDGER,
    countsTowardSpending: false,
    homeNetContribution: "income",
    canGenericCorrect: true,
    canGenericRefund: false,
  },
  [TransactionLedgerType.EXPENSE]: {
    category: FinancialEventCategory.EXPENSE,
    classification: FinancialClassification.EXPENSE,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: true,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.LEDGER,
    countsTowardSpending: true,
    homeNetContribution: "expense",
    canGenericCorrect: true,
    canGenericRefund: true,
  },
  [TransactionLedgerType.INVESTMENT_INCOME]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.INCOME,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: true,
    countsTowardExpense: false,
    sign: "+",
    displayDirection: FinancialDisplayDirection.INCOMING,
    owner: TransactionOwner.INVESTMENT,
    countsTowardSpending: false,
    homeNetContribution: "income",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.INVESTMENT_FEE]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.EXPENSE,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: true,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.INVESTMENT,
    countsTowardSpending: true,
    homeNetContribution: "expense",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.INVESTMENT_BUY]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.INVESTMENT,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.INVESTMENT_SELL_PROCEEDS]: {
    category: FinancialEventCategory.INVESTMENT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
    displayDirection: FinancialDisplayDirection.INCOMING,
    owner: TransactionOwner.INVESTMENT,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.DEBT_BORROWING]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
    displayDirection: FinancialDisplayDirection.INCOMING,
    owner: TransactionOwner.DEBT,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.DEBT_LENDING]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.DEBT,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT]: {
    category: FinancialEventCategory.DEBT,
    classification: FinancialClassification.NON_INCOME_INFLOW,
    cashDirection: FinancialCashDirection.INFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "+",
    displayDirection: FinancialDisplayDirection.INCOMING,
    owner: TransactionOwner.DEBT,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.LIABILITY_PAYMENT]: {
    category: FinancialEventCategory.LIABILITY,
    classification: FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: false,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.LOAN,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
  [TransactionLedgerType.LOAN_INTEREST]: {
    category: FinancialEventCategory.LIABILITY,
    classification: FinancialClassification.EXPENSE,
    cashDirection: FinancialCashDirection.OUTFLOW,
    countsTowardIncome: false,
    countsTowardExpense: true,
    sign: "−",
    displayDirection: FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.LOAN,
    countsTowardSpending: true,
    homeNetContribution: "expense",
    canGenericCorrect: false,
    canGenericRefund: false,
  },
};

function savingsCategory(row: FinancialSemanticRow): boolean {
  return (
    row.savingsEventKind?.toUpperCase().startsWith(SAVINGS_EVENT_PREFIX) ??
    false
  );
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
    displayDirection: FinancialDisplayDirection.REFUND,
    owner: TransactionOwner.LEDGER,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
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
    displayDirection:
      cashDirection === FinancialCashDirection.INFLOW
        ? FinancialDisplayDirection.INCOMING
        : FinancialDisplayDirection.OUTGOING,
    owner: savingsCategory(row)
      ? TransactionOwner.SAVINGS
      : TransactionOwner.TRANSFER,
    countsTowardSpending: false,
    homeNetContribution: "neutral",
    canGenericCorrect: false,
    canGenericRefund: false,
  };
}

function savingsEventSemantics(
  row: FinancialSemanticRow,
): FinancialEventSemantics | null {
  const kind = row.savingsEventKind?.toUpperCase();
  if (!kind?.startsWith(SAVINGS_EVENT_PREFIX)) return null;
  if (kind.includes("PRINCIPAL")) {
    const base =
      row.type === TransactionLedgerType.TRANSFER_IN
        ? FinancialCashDirection.INFLOW
        : FinancialCashDirection.OUTFLOW;
    return transferLegSemantics(
      row,
      base === FinancialCashDirection.INFLOW
        ? TransactionLedgerType.TRANSFER_IN
        : TransactionLedgerType.TRANSFER_OUT,
    );
  }
  const isInterest = kind.includes("INTEREST");
  const isExpense = kind.includes("TAX") || kind.includes("FEE");
  if (!isInterest && !isExpense) return null;
  return {
    category: FinancialEventCategory.SAVINGS,
    classification: isInterest
      ? FinancialClassification.INCOME
      : FinancialClassification.EXPENSE,
    cashDirection: isInterest
      ? FinancialCashDirection.INFLOW
      : FinancialCashDirection.OUTFLOW,
    countsTowardIncome: isInterest,
    countsTowardExpense: isExpense,
    sign: isInterest ? "+" : "−",
    displayDirection: isInterest
      ? FinancialDisplayDirection.INCOMING
      : FinancialDisplayDirection.OUTGOING,
    owner: TransactionOwner.SAVINGS,
    countsTowardSpending: isExpense,
    homeNetContribution: isInterest ? "income" : "expense",
    canGenericCorrect: false,
    canGenericRefund: false,
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
  const reversed = Boolean(
    row.isReversal || row.reversesTransactionId || row.correctsTransactionId,
  );
  const type = row.type;

  if (reversed) {
    return classifyReversalSemantics(type);
  }

  const savingsSemantics = savingsEventSemantics(row);
  if (savingsSemantics) return savingsSemantics;

  if (
    type === TransactionLedgerType.TRANSFER_OUT ||
    type === TransactionLedgerType.TRANSFER_IN
  ) {
    return transferLegSemantics(row, type);
  }

  const semantics =
    LEDGER_TYPE_EVENT_SEMANTICS[type as TransactionLedgerTypeValue] ??
    DEFAULT_EVENT_SEMANTICS;
  if (
    row.accountType === AccountType.CREDIT_CARD &&
    (type === TransactionLedgerType.INCOME ||
      type === TransactionLedgerType.EXPENSE)
  ) {
    return {
      ...semantics,
      owner: TransactionOwner.CREDIT_CARD,
      canGenericCorrect: false,
      canGenericRefund: false,
    };
  }
  return semantics;
}

export function getTransactionActionCapabilities(
  row: FinancialSemanticRow,
): Pick<
  FinancialEventSemantics,
  "owner" | "canGenericCorrect" | "canGenericRefund"
> {
  const semantics = classifyFinancialEvent(row);
  return {
    owner: semantics.owner,
    canGenericCorrect: semantics.canGenericCorrect,
    canGenericRefund: semantics.canGenericRefund,
  };
}

export function countsTowardMonthlyIncome(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardIncome;
}

export function countsTowardMonthlyExpense(row: FinancialSemanticRow): boolean {
  return classifyFinancialEvent(row).countsTowardExpense;
}
