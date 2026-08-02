import type { AccountType, LedgerAccount } from "./account-types";

export type TransactionDirection = "income" | "expense";

export type LedgerTransaction = {
  id: string;
  accountId: string;
  accountName?: string;
  type: TransactionDirection;
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
  kind: TransactionDirection;
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
    if (row.type === "income") account.balance += amount;
    if (row.type === "expense") account.balance -= amount;
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
    type: row.type === "income" ? "income" : "expense",
    amount: Number.isFinite(amount) ? amount : 0,
    currency: (row.currency ?? "VND").toUpperCase(),
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
