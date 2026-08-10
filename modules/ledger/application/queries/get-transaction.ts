import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapTransactionRow,
  type LedgerTransaction,
  type TransactionDirection,
} from "../transaction-types";
import {
  TransactionDirection as Direction,
  TransactionFilterType,
  TRANSACTION_LEDGER_TYPE_VALUES,
} from "../ledger-constants";

function normalizeJoinedRow(row: Record<string, unknown>) {
  return mapTransactionRow({
    ...(row as Parameters<typeof mapTransactionRow>[0]),
    accounts: Array.isArray(row.accounts)
      ? (row.accounts[0] as { name: string } | undefined)
      : (row.accounts as { name: string } | null),
    categories: Array.isArray(row.categories)
      ? (row.categories[0] as { name: string } | undefined)
      : (row.categories as { name: string } | null),
    jars: Array.isArray(row.jars)
      ? (row.jars[0] as { name: string } | undefined)
      : (row.jars as { name: string } | null),
  });
}

const TX_SELECT =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name), categories(name), jars(name)";

export async function getTransaction(
  transactionId: string,
): Promise<LedgerTransaction | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !transactionId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeJoinedRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type ListTransactionsFilter = {
  q?: string;
  type?: TransactionDirection | typeof TransactionFilterType.ALL | typeof TransactionFilterType.INVESTMENT;
  limit?: number;
};

export async function listTransactions(
  filter: ListTransactionsFilter = {},
): Promise<LedgerTransaction[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false })
      .limit(filter.limit ?? 100);

    if (filter.type === Direction.INCOME || filter.type === Direction.EXPENSE) {
      query = query.eq("type", filter.type);
    }
    if (filter.type === TransactionFilterType.INVESTMENT) {
      query = query.in(
        "type",
        TRANSACTION_LEDGER_TYPE_VALUES.filter((type) =>
          type.startsWith(TransactionFilterType.INVESTMENT),
        ),
      );
    }

    const { data, error } = await query;
    if (error) {
      return null;
    }

    const rows = (data ?? []).map((row) =>
      normalizeJoinedRow(row as Record<string, unknown>),
    );

    const q = filter.q?.trim().toLowerCase();
    if (!q) {
      return rows;
    }

    return rows.filter((tx) => {
      const haystack = [
        tx.note,
        tx.categoryName,
        tx.accountName,
        tx.jarName,
        tx.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  } catch {
    return null;
  }
}
