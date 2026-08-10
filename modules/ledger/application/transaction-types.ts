import type { AccountType, LedgerAccount } from "./account-types";
import {
  DEFAULT_CURRENCY,
  TransactionDirection,
  TransactionLedgerType,
  TransactionStatus,
  TRANSACTION_LEDGER_CREDIT_TYPES,
  TRANSACTION_LEDGER_DEBIT_TYPES,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "./ledger-constants";

export {
  TransactionDirection,
  TRANSACTION_DIRECTION_OPTIONS,
  TRANSACTION_DIRECTION_VALUES,
  TransactionLedgerType,
  TRANSACTION_LEDGER_TYPE_VALUES,
  TransactionStatus,
  TRANSACTION_STATUS_VALUES,
  DEFAULT_CURRENCY,
} from "./ledger-constants";

export type LedgerTransaction = {
  id: string;
  accountId: string;
  accountName?: string;
  type: TransactionLedgerTypeValue;
  amount: number;
  currency: string;
  transactionDate: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  jarId: string | null;
  jarName: string | null;
  status: string;
  transferGroupId: string | null;
  reversesTransactionId: string | null;
  correctsTransactionId: string | null;
  isReversal: boolean;
  createdAt: string;
};

export type CategoryTag = {
  id: string;
  kind: TransactionDirection;
  name: string;
  jarId: string | null;
};

export type CaptureJarOption = {
  id: string;
  name: string;
  kind: string;
};

export function applyTransactionDeltas(
  accounts: LedgerAccount[],
  deltas: Array<{ accountId: string; type: string; amount: number | string }>,
): LedgerAccount[] {
  const byId = new Map(accounts.map((a) => [a.id, { ...a }]));
  for (const row of deltas) {
    const account = byId.get(row.accountId);
    if (!account) continue;
    const amount =
      typeof row.amount === "string" ? Number(row.amount) : row.amount;
    if (!Number.isFinite(amount)) continue;
    if ((TRANSACTION_LEDGER_CREDIT_TYPES as readonly string[]).includes(row.type)) {
      account.balance += amount;
    }
    if ((TRANSACTION_LEDGER_DEBIT_TYPES as readonly string[]).includes(row.type)) {
      account.balance -= amount;
    }
  }
  return Array.from(byId.values());
}

function mapLedgerType(type: string): TransactionLedgerTypeValue {
  if (type === TransactionLedgerType.INCOME) {
    return TransactionLedgerType.INCOME;
  }
  if (type === TransactionLedgerType.LIABILITY_PAYMENT) {
    return TransactionLedgerType.LIABILITY_PAYMENT;
  }
  if (type === TransactionLedgerType.TRANSFER_OUT) {
    return TransactionLedgerType.TRANSFER_OUT;
  }
  if (type === TransactionLedgerType.TRANSFER_IN) {
    return TransactionLedgerType.TRANSFER_IN;
  }
  if (type === TransactionLedgerType.INVESTMENT_BUY) {
    return TransactionLedgerType.INVESTMENT_BUY;
  }
  if (type === TransactionLedgerType.INVESTMENT_SELL_PROCEEDS) {
    return TransactionLedgerType.INVESTMENT_SELL_PROCEEDS;
  }
  if (type === TransactionLedgerType.INVESTMENT_INCOME) {
    return TransactionLedgerType.INVESTMENT_INCOME;
  }
  if (type === TransactionLedgerType.INVESTMENT_FEE) {
    return TransactionLedgerType.INVESTMENT_FEE;
  }
  return TransactionLedgerType.EXPENSE;
}

export function mapTransactionRow(row: {
  id: string;
  account_id: string;
  type: string;
  amount: number | string;
  currency: string;
  transaction_date: string;
  note: string | null;
  category_id: string | null;
  jar_id: string | null;
  status?: string | null;
  transfer_group_id?: string | null;
  reverses_transaction_id?: string | null;
  corrects_transaction_id?: string | null;
  is_reversal?: boolean | null;
  created_at: string;
  accounts?: { name: string } | null;
  categories?: { name: string } | null;
  jars?: { name: string } | null;
}): LedgerTransaction {
  const amount =
    typeof row.amount === "string" ? Number(row.amount) : row.amount;
  const reversesTransactionId = row.reverses_transaction_id ?? null;
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.accounts?.name,
    type: mapLedgerType(row.type),
    amount: Number.isFinite(amount) ? amount : 0,
    currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    transactionDate: row.transaction_date,
    note: row.note,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    jarId: row.jar_id,
    jarName: row.jars?.name ?? null,
    status: row.status ?? TransactionStatus.POSTED,
    transferGroupId: row.transfer_group_id ?? null,
    reversesTransactionId,
    correctsTransactionId: row.corrects_transaction_id ?? null,
    isReversal: Boolean(row.is_reversal) || reversesTransactionId != null,
    createdAt: row.created_at,
  };
}

export type { AccountType, LedgerAccount };
