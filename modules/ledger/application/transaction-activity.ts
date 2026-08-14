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
  isReversal: boolean;
};

const INVESTMENT_LEDGER_TYPES = new Set<TransactionLedgerTypeValue>([
  TransactionLedgerType.INVESTMENT_BUY,
  TransactionLedgerType.INVESTMENT_SELL_PROCEEDS,
  TransactionLedgerType.INVESTMENT_INCOME,
  TransactionLedgerType.INVESTMENT_FEE,
]);

function kindForLedgerRow(row: LedgerTransaction): TransactionActivityKind {
  if (row.isReversal) return TransactionActivityKind.REFUND;
  if (INVESTMENT_LEDGER_TYPES.has(row.type))
    return TransactionActivityKind.INVESTMENT;

  switch (row.type) {
    case TransactionLedgerType.INCOME:
      return TransactionActivityKind.INCOME;
    case TransactionLedgerType.EXPENSE:
      return TransactionActivityKind.EXPENSE;
    case TransactionLedgerType.LIABILITY_PAYMENT:
      return TransactionActivityKind.LIABILITY_PAYMENT;
    case TransactionLedgerType.DEBT_BORROWING:
      return TransactionActivityKind.DEBT_BORROWING;
    case TransactionLedgerType.DEBT_LENDING:
      return TransactionActivityKind.DEBT_LENDING;
    case TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT:
      return TransactionActivityKind.DEBT_RECEIPT;
    case TransactionLedgerType.TRANSFER_OUT:
    case TransactionLedgerType.TRANSFER_IN:
      return TransactionActivityKind.TRANSFER;
    default:
      return TransactionActivityKind.OTHER;
  }
}

function toneForKind(kind: TransactionActivityKind): TransactionActivityTone {
  if (
    kind === TransactionActivityKind.INCOME ||
    kind === TransactionActivityKind.REFUND ||
    kind === TransactionActivityKind.DEBT_BORROWING ||
    kind === TransactionActivityKind.DEBT_RECEIPT
  ) {
    return TransactionActivityTone.CREDIT;
  }
  if (
    kind === TransactionActivityKind.EXPENSE ||
    kind === TransactionActivityKind.DEBT_LENDING ||
    kind === TransactionActivityKind.LIABILITY_PAYMENT
  ) {
    return TransactionActivityTone.DEBIT;
  }
  return TransactionActivityTone.NEUTRAL;
}

function activityFromRow(row: LedgerTransaction): TransactionActivity {
  const kind = kindForLedgerRow(row);
  return {
    id: row.id,
    kind,
    tone: toneForKind(kind),
    amount: row.amount,
    currency: row.currency,
    effectiveDate: row.transactionDate,
    note: row.note,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    tags: row.tags,
    status: row.status,
    sourceAccount:
      kind === TransactionActivityKind.EXPENSE ||
      kind === TransactionActivityKind.DEBT_LENDING ||
      kind === TransactionActivityKind.LIABILITY_PAYMENT
        ? { id: row.accountId, name: row.accountName }
        : null,
    destinationAccount:
      kind === TransactionActivityKind.INCOME ||
      kind === TransactionActivityKind.REFUND ||
      kind === TransactionActivityKind.DEBT_BORROWING ||
      kind === TransactionActivityKind.DEBT_RECEIPT
        ? { id: row.accountId, name: row.accountName }
        : null,
    relatedTransactionIds: [row.id],
    transferGroupId: row.transferGroupId,
    isReversal: row.isReversal,
  };
}

/** Projects raw ledger rows into a global activity list without double-counting transfers. */
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
    activities.push({
      id: transferGroupId,
      kind: TransactionActivityKind.TRANSFER,
      tone: TransactionActivityTone.NEUTRAL,
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
      isReversal: false,
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
