import type { AccountType, LedgerAccount } from "./account-types";
import {
  DEFAULT_CURRENCY,
  TransactionDirection,
  type TransactionDirection as TransactionDirectionValue,
} from "./ledger-constants";

export {
  TransactionDirection,
  TRANSACTION_DIRECTION_OPTIONS,
  TRANSACTION_DIRECTION_VALUES,
  DEFAULT_CURRENCY,
} from "./ledger-constants";

export type LedgerTransaction = {
  id: string;
  accountId: string;
  accountName?: string;
  type: TransactionDirectionValue;
  amount: number;
  currency: string;
  transactionDate: string;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  jarId: string | null;
  jarName: string | null;
  createdAt: string;
};

export type CategoryTag = {
  id: string;
  kind: TransactionDirectionValue;
  name: string;
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
    if (row.type === TransactionDirection.INCOME) account.balance += amount;
    if (row.type === TransactionDirection.EXPENSE) account.balance -= amount;
  }
  return Array.from(byId.values());
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
  created_at: string;
  accounts?: { name: string } | null;
  categories?: { name: string } | null;
  jars?: { name: string } | null;
}): LedgerTransaction {
  const amount =
    typeof row.amount === "string" ? Number(row.amount) : row.amount;
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.accounts?.name,
    type:
      row.type === TransactionDirection.INCOME
        ? TransactionDirection.INCOME
        : TransactionDirection.EXPENSE,
    amount: Number.isFinite(amount) ? amount : 0,
    currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    transactionDate: row.transaction_date,
    note: row.note,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    jarId: row.jar_id,
    jarName: row.jars?.name ?? null,
    createdAt: row.created_at,
  };
}

export type { AccountType, LedgerAccount };
