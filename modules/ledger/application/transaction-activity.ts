import {
  FinancialEventCategory,
  FinancialClassification,
  FinancialCashDirection,
  classifyFinancialEvent,
  type FinancialEventSemantics,
} from "./financial-semantics";
import {
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
  NEUTRAL: "neutral",
} as const;
export type TransactionActivityTone =
  (typeof TransactionActivityTone)[keyof typeof TransactionActivityTone];

export type TransactionActivity = {
  id: string;
  kind: TransactionActivityKind;
  tone: TransactionActivityTone;
  amount: number;
  currency: string;
  effectiveDate: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  tags: TransactionTag[];
  status: string;
  sourceAccount: { id: string; name?: string } | null;
  destinationAccount: { id: string; name?: string } | null;
  relatedTransactionIds: readonly string[];
  transferGroupId: string | null;
  savingsEventKind: string | null;
  isReversal: boolean;
  semanticCategory: (typeof FinancialEventCategory)[keyof typeof FinancialEventCategory];
  classification: (typeof FinancialClassification)[keyof typeof FinancialClassification];
  cashDirection: (typeof FinancialCashDirection)[keyof typeof FinancialCashDirection];
  countsTowardIncome: boolean;
  countsTowardExpense: boolean;
  sign: "+" | "−" | "";
};

const LEDGER_TYPE_TO_ACTIVITY_KIND: Partial<
  Record<TransactionLedgerTypeValue, TransactionActivityKind>
> = {
  [TransactionLedgerType.INCOME]: TransactionActivityKind.INCOME,
  [TransactionLedgerType.EXPENSE]: TransactionActivityKind.EXPENSE,
  [TransactionLedgerType.LIABILITY_PAYMENT]:
    TransactionActivityKind.LIABILITY_PAYMENT,
  [TransactionLedgerType.DEBT_BORROWING]: TransactionActivityKind.DEBT_BORROWING,
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
): TransactionActivityTone {
  if (semantics.cashDirection === FinancialCashDirection.INFLOW) {
    return TransactionActivityTone.CREDIT;
  }
  if (semantics.cashDirection === FinancialCashDirection.OUTFLOW) {
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
    tone: toneForSemantics(semantics),
    amount: row.amount,
    currency: row.currency,
    effectiveDate: row.transactionDate,
    note: row.note,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    tags: row.tags,
    status: row.status,
    ...accounts,
    relatedTransactionIds: [row.id],
    transferGroupId: row.transferGroupId,
    savingsEventKind: row.savingsEventKind ?? null,
    isReversal: row.isReversal,
    semanticCategory: semantics.category,
    classification: semantics.classification,
    cashDirection: semantics.cashDirection,
    countsTowardIncome: semantics.countsTowardIncome,
    countsTowardExpense: semantics.countsTowardExpense,
    sign: semantics.sign,
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
    };
  }

  const eventKind = savingsRow.savingsEventKind?.toUpperCase() ?? "";
  const preferredRow = eventKind.includes("PLACEMENT")
    ? rows.find((row) => row.type === TransactionLedgerType.TRANSFER_OUT)
    : rows.find((row) => row.type === TransactionLedgerType.TRANSFER_IN);
  const legSemantics = classifyFinancialEvent(preferredRow ?? savingsRow);
  const isInterest = eventKind.includes("INTEREST");
  return {
    category: FinancialEventCategory.SAVINGS,
    classification: isInterest
      ? FinancialClassification.INCOME
      : legSemantics.cashDirection === FinancialCashDirection.INFLOW
        ? FinancialClassification.NON_INCOME_INFLOW
        : FinancialClassification.NON_EXPENSE_OUTFLOW,
    cashDirection: legSemantics.cashDirection,
    countsTowardIncome: isInterest,
    countsTowardExpense: false,
    sign: legSemantics.sign,
  };
}

/** Projects raw ledger rows into one user-level activity per grouped action. */
export function createTransactionActivities(
  rows: readonly LedgerTransaction[],
): TransactionActivity[] {
  const transferGroups = new Map<string, LedgerTransaction[]>();
  const activities: TransactionActivity[] = [];

  for (const row of rows) {
    if (
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
      savingsEventKind: representative.savingsEventKind ?? null,
      isReversal: false,
      semanticCategory: semantics.category,
      classification: semantics.classification,
      cashDirection: semantics.cashDirection,
      countsTowardIncome: semantics.countsTowardIncome,
      countsTowardExpense: semantics.countsTowardExpense,
      sign: semantics.sign,
    });
  }

  return activities.sort((left, right) =>
    right.effectiveDate.localeCompare(left.effectiveDate),
  );
}

export function transactionActivityCanUseGenericActions(
  activity: TransactionActivity,
): boolean {
  return (
    activity.kind === TransactionActivityKind.EXPENSE && !activity.isReversal
  );
}
