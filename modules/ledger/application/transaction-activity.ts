import {
  FinancialEventCategory,
  FinancialClassification,
  FinancialCashDirection,
  FinancialDisplayDirection,
  FinancialHomeNetContribution,
  TransactionOwner,
  classifyFinancialEvent,
  type FinancialEventSemantics,
} from "./financial-semantics";
import {
  TransactionFilterType,
  TransactionLedgerType,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "./ledger-constants";
import type { LedgerTransaction, TransactionTag } from "./transaction-types";

/**
 * Canonical user-facing activity semantics. These are intentionally separate
 * from persisted ledger movement types: a transfer is one neutral activity
 * even though it is recorded as a debit and a credit leg.
 */
export const TransactionActivityKind = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  SAVINGS: "savings",
  REFUND: "refund",
  LIABILITY_PAYMENT: "liability_payment",
  LOAN_INTEREST: "loan_interest",
  DEBT_BORROWING: "debt_borrowing",
  DEBT_LENDING: "debt_lending",
  DEBT_RECEIPT: "debt_receipt",
  INVESTMENT: "investment",
  OTHER: "other",
} as const;
export type TransactionActivityKind =
  (typeof TransactionActivityKind)[keyof typeof TransactionActivityKind];

export const TransactionActivityTone = {
  CREDIT: "credit",
  DEBIT: "debit",
  REFUND: "refund",
  NEUTRAL: "neutral",
} as const;
export type TransactionActivityTone =
  (typeof TransactionActivityTone)[keyof typeof TransactionActivityTone];

export const TransactionProductEvent = {
  CARD_PAYMENT: "card_payment",
} as const;

export type TransactionProductEvent =
  (typeof TransactionProductEvent)[keyof typeof TransactionProductEvent];

export type TransactionActivity = {
  id: string;
  kind: TransactionActivityKind;
  tone: TransactionActivityTone;
  amount: number;
  currency: string;
  effectiveDate: string;
  representativeCreatedAt: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  tags: TransactionTag[];
  status: string;
  sourceAccount: { id: string; name?: string } | null;
  destinationAccount: { id: string; name?: string } | null;
  relatedTransactionIds: readonly string[];
  transferGroupId: string | null;
  loanPaymentId: string | null;
  savingsEventKind: string | null;
  isReversal: boolean;
  semanticCategory: (typeof FinancialEventCategory)[keyof typeof FinancialEventCategory];
  classification: (typeof FinancialClassification)[keyof typeof FinancialClassification];
  cashDirection: (typeof FinancialCashDirection)[keyof typeof FinancialCashDirection];
  countsTowardIncome: boolean;
  countsTowardExpense: boolean;
  owner: TransactionOwner;
  productEvent: TransactionProductEvent | null;
  sign: "+" | "−" | "";
  canGenericCorrect: boolean;
  canGenericRefund: boolean;
};

const LEDGER_TYPE_TO_ACTIVITY_KIND: Partial<
  Record<TransactionLedgerTypeValue, TransactionActivityKind>
> = {
  [TransactionLedgerType.INCOME]: TransactionActivityKind.INCOME,
  [TransactionLedgerType.EXPENSE]: TransactionActivityKind.EXPENSE,
  [TransactionLedgerType.LIABILITY_PAYMENT]:
    TransactionActivityKind.LIABILITY_PAYMENT,
  [TransactionLedgerType.LOAN_INTEREST]: TransactionActivityKind.LOAN_INTEREST,
  [TransactionLedgerType.DEBT_BORROWING]:
    TransactionActivityKind.DEBT_BORROWING,
  [TransactionLedgerType.DEBT_LENDING]: TransactionActivityKind.DEBT_LENDING,
  [TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT]:
    TransactionActivityKind.DEBT_RECEIPT,
  [TransactionLedgerType.TRANSFER_OUT]: TransactionActivityKind.TRANSFER,
  [TransactionLedgerType.TRANSFER_IN]: TransactionActivityKind.TRANSFER,
  [TransactionLedgerType.INVESTMENT_BUY]: TransactionActivityKind.INVESTMENT,
  [TransactionLedgerType.INVESTMENT_SELL_PROCEEDS]:
    TransactionActivityKind.INVESTMENT,
  [TransactionLedgerType.INVESTMENT_INCOME]: TransactionActivityKind.INVESTMENT,
  [TransactionLedgerType.INVESTMENT_FEE]: TransactionActivityKind.INVESTMENT,
};

function kindForLedgerRow(
  row: LedgerTransaction,
  semantics: FinancialEventSemantics,
): TransactionActivityKind {
  if (row.isReversal) return TransactionActivityKind.REFUND;
  if (semantics.category === FinancialEventCategory.SAVINGS) {
    return TransactionActivityKind.SAVINGS;
  }
  return (
    LEDGER_TYPE_TO_ACTIVITY_KIND[row.type] ?? TransactionActivityKind.OTHER
  );
}

function toneForSemantics(
  semantics: FinancialEventSemantics,
  kind?: TransactionActivityKind,
): TransactionActivityTone {
  if (kind === TransactionActivityKind.REFUND) {
    return TransactionActivityTone.REFUND;
  }
  if (semantics.countsTowardIncome) {
    return TransactionActivityTone.CREDIT;
  }
  if (semantics.countsTowardExpense) {
    return TransactionActivityTone.DEBIT;
  }
  return TransactionActivityTone.NEUTRAL;
}

function accountEffectForRow(
  row: LedgerTransaction,
  semantics: FinancialEventSemantics,
): {
  sourceAccount: { id: string; name?: string } | null;
  destinationAccount: { id: string; name?: string } | null;
} {
  if (semantics.cashDirection === FinancialCashDirection.OUTFLOW) {
    return {
      sourceAccount: { id: row.accountId, name: row.accountName },
      destinationAccount: null,
    };
  }
  if (semantics.cashDirection === FinancialCashDirection.INFLOW) {
    return {
      sourceAccount: null,
      destinationAccount: { id: row.accountId, name: row.accountName },
    };
  }
  return { sourceAccount: null, destinationAccount: null };
}

function activityFromRow(row: LedgerTransaction): TransactionActivity {
  const semantics = classifyFinancialEvent(row);
  const kind = kindForLedgerRow(row, semantics);
  const accounts = accountEffectForRow(row, semantics);
  return {
    id: row.id,
    kind,
    tone: toneForSemantics(semantics, kind),
    amount: row.amount,
    currency: row.currency,
    effectiveDate: row.transactionDate,
    representativeCreatedAt: row.createdAt,
    note: row.note,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    tags: row.tags,
    status: row.status,
    ...accounts,
    relatedTransactionIds: [row.id],
    transferGroupId: row.transferGroupId,
    loanPaymentId: row.loanPaymentId,
    savingsEventKind: row.savingsEventKind ?? null,
    isReversal: row.isReversal,
    semanticCategory: semantics.category,
    classification: semantics.classification,
    cashDirection: semantics.cashDirection,
    countsTowardIncome: semantics.countsTowardIncome,
    countsTowardExpense: semantics.countsTowardExpense,
    owner: semantics.owner,
    productEvent: null,
    sign: semantics.sign,
    canGenericCorrect: semantics.canGenericCorrect,
    canGenericRefund: semantics.canGenericRefund,
  };
}

function groupedSemantics(
  rows: readonly LedgerTransaction[],
): FinancialEventSemantics {
  const savingsRow = rows.find((row) => row.savingsEventKind) ?? null;
  if (!savingsRow) {
    return {
      category: FinancialEventCategory.TRANSFER,
      classification: FinancialClassification.TRANSFER,
      cashDirection: FinancialCashDirection.NEUTRAL,
      countsTowardIncome: false,
      countsTowardExpense: false,
      sign: "",
      displayDirection: FinancialDisplayDirection.NEUTRAL,
      owner: TransactionOwner.TRANSFER,
      countsTowardSpending: false,
      homeNetContribution: FinancialHomeNetContribution.NEUTRAL,
      canGenericCorrect: false,
      canGenericRefund: false,
    };
  }

  const eventKind = savingsRow.savingsEventKind?.toUpperCase() ?? "";
  const preferredRow = eventKind.includes("PLACEMENT")
    ? rows.find((row) => row.type === TransactionLedgerType.TRANSFER_OUT)
    : rows.find((row) => row.type === TransactionLedgerType.TRANSFER_IN);
  const legSemantics = classifyFinancialEvent(preferredRow ?? savingsRow);
  const isInterest = eventKind.includes("INTEREST");
  return {
    ...legSemantics,
    category: FinancialEventCategory.SAVINGS,
    classification: isInterest
      ? FinancialClassification.INCOME
      : legSemantics.cashDirection === FinancialCashDirection.INFLOW
        ? FinancialClassification.NON_INCOME_INFLOW
        : FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: legSemantics.cashDirection,
    countsTowardIncome: isInterest,
    countsTowardExpense: false,
    countsTowardSpending: false,
    homeNetContribution: isInterest
      ? FinancialHomeNetContribution.INCOME
      : FinancialHomeNetContribution.NEUTRAL,
    canGenericCorrect: false,
    canGenericRefund: false,
  };
}

/** Projects raw ledger rows into one user-level activity per grouped action. */
export function createTransactionActivities(
  rows: readonly LedgerTransaction[],
): TransactionActivity[] {
  const transferGroups = new Map<string, LedgerTransaction[]>();
  const loanPaymentGroups = new Map<string, LedgerTransaction[]>();
  const activities: TransactionActivity[] = [];

  for (const row of rows) {
    if (
      row.loanPaymentId &&
      (row.type === TransactionLedgerType.LIABILITY_PAYMENT ||
        row.type === TransactionLedgerType.LOAN_INTEREST)
    ) {
      const group = loanPaymentGroups.get(row.loanPaymentId) ?? [];
      group.push(row);
      loanPaymentGroups.set(row.loanPaymentId, group);
    } else if (
      row.transferGroupId &&
      (row.type === TransactionLedgerType.TRANSFER_OUT ||
        row.type === TransactionLedgerType.TRANSFER_IN)
    ) {
      const group = transferGroups.get(row.transferGroupId) ?? [];
      group.push(row);
      transferGroups.set(row.transferGroupId, group);
    } else {
      activities.push(activityFromRow(row));
    }
  }

  for (const [loanPaymentId, rowsInGroup] of loanPaymentGroups) {
    const representative =
      rowsInGroup.find(
        (row) => row.type === TransactionLedgerType.LIABILITY_PAYMENT,
      ) ?? rowsInGroup[0];
    if (!representative) continue;
    const semantics = classifyFinancialEvent(representative);
    activities.push({
      ...activityFromRow(representative),
      id: loanPaymentId,
      kind: TransactionActivityKind.LIABILITY_PAYMENT,
      tone: TransactionActivityTone.NEUTRAL,
      amount: rowsInGroup.reduce((sum, row) => sum + row.amount, 0),
      relatedTransactionIds: rowsInGroup.map((row) => row.id),
      loanPaymentId,
      semanticCategory: semantics.category,
      classification: semantics.classification,
      cashDirection: semantics.cashDirection,
      countsTowardIncome: false,
      countsTowardExpense: false,
      owner: semantics.owner,
      sign: "",
    });
  }

  for (const [transferGroupId, rowsInGroup] of transferGroups) {
    const source =
      rowsInGroup.find(
        (row) => row.type === TransactionLedgerType.TRANSFER_OUT,
      ) ?? null;
    const destination =
      rowsInGroup.find(
        (row) => row.type === TransactionLedgerType.TRANSFER_IN,
      ) ?? null;
    const representative = source ?? destination;
    if (!representative) continue;

    const semantics = groupedSemantics(rowsInGroup);
    const isSavings = semantics.category === FinancialEventCategory.SAVINGS;
    activities.push({
      id: transferGroupId,
      kind: isSavings
        ? TransactionActivityKind.SAVINGS
        : TransactionActivityKind.TRANSFER,
      tone: isSavings
        ? toneForSemantics(semantics)
        : TransactionActivityTone.NEUTRAL,
      amount: representative.amount,
      currency: representative.currency,
      effectiveDate: representative.transactionDate,
      representativeCreatedAt: rowsInGroup.reduce(
        (latest, row) => (row.createdAt > latest ? row.createdAt : latest),
        representative.createdAt,
      ),
      note: representative.note ?? destination?.note ?? null,
      categoryId: null,
      categoryName: null,
      tags: representative.tags,
      status: representative.status,
      sourceAccount: source
        ? { id: source.accountId, name: source.accountName }
        : null,
      destinationAccount: destination
        ? { id: destination.accountId, name: destination.accountName }
        : null,
      relatedTransactionIds: rowsInGroup.map((row) => row.id),
      transferGroupId,
      loanPaymentId: null,
      savingsEventKind: representative.savingsEventKind ?? null,
      isReversal: false,
      semanticCategory: semantics.category,
      classification: semantics.classification,
      cashDirection: semantics.cashDirection,
      countsTowardIncome: semantics.countsTowardIncome,
      countsTowardExpense: semantics.countsTowardExpense,
      owner: semantics.owner,
      productEvent: null,
      sign: semantics.sign,
      canGenericCorrect: semantics.canGenericCorrect,
      canGenericRefund: semantics.canGenericRefund,
    });
  }

  return activities.sort((left, right) => {
    const byDate = right.effectiveDate.localeCompare(left.effectiveDate);
    if (byDate !== 0) return byDate;
    const byCreatedAt = right.representativeCreatedAt.localeCompare(
      left.representativeCreatedAt,
    );
    return byCreatedAt !== 0 ? byCreatedAt : right.id.localeCompare(left.id);
  });
}

export function transactionActivityMatchesFilter(
  activity: TransactionActivity,
  filter: TransactionFilterType,
): boolean {
  if (filter === TransactionFilterType.ALL) return true;
  if (filter === TransactionFilterType.INCOME) {
    return activity.countsTowardIncome;
  }
  if (filter === TransactionFilterType.EXPENSE) {
    return activity.countsTowardExpense;
  }
  return (
    filter === TransactionFilterType.TRANSFER &&
    activity.kind === TransactionActivityKind.TRANSFER
  );
}

export function transactionActivityCanUseGenericActions(
  activity: TransactionActivity,
): boolean {
  return activity.canGenericCorrect || activity.canGenericRefund;
}
