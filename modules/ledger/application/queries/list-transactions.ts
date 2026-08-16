import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapTransactionRow,
  type CategoryTag,
  type CaptureJarOption,
  type LedgerTransaction,
  type TransactionDirection,
} from "../transaction-types";
import { TransactionDirection as Direction } from "../ledger-constants";

const TRANSACTION_LIST_SELECT =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, savings_event_kind, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name), categories(name), jars(name), transaction_tag_assignments(tag_id, transaction_tags(id, name, icon_key, color_key, archived_at))";

function mapTransactionRows(rows: unknown[]): LedgerTransaction[] {
  return rows.map((raw) => {
    const row = raw as {
      id: string;
      account_id: string;
      type: string;
      amount: number | string;
      currency: string;
      transaction_date: string;
      note: string | null;
      category_id: string | null;
      jar_id: string | null;
      status: string | null;
      transfer_group_id: string | null;
      savings_event_kind: string | null;
      reverses_transaction_id: string | null;
      corrects_transaction_id: string | null;
      is_reversal: boolean | null;
      created_at: string;
      accounts: { name: string } | { name: string }[] | null;
      categories: { name: string } | { name: string }[] | null;
      jars: { name: string } | { name: string }[] | null;
      transaction_tag_assignments: Array<{
        transaction_tags: {
          id: string;
          name: string;
          icon_key: string;
          color_key: string | null;
          archived_at: string | null;
        } | null;
      }> | null;
    };
    return mapTransactionRow({
      ...row,
      accounts: Array.isArray(row.accounts) ? row.accounts[0] : row.accounts,
      categories: Array.isArray(row.categories)
        ? row.categories[0]
        : row.categories,
      jars: Array.isArray(row.jars) ? row.jars[0] : row.jars,
    });
  });
}

export async function listRecentTransactions(
  limit = 20,
  accountId?: string,
): Promise<LedgerTransaction[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_LIST_SELECT)
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (accountId) {
      query = query.eq("account_id", accountId);
    }
    const { data, error } = await query;
    if (error) {
      return null;
    }
    return mapTransactionRows(data ?? []);
  } catch {
    return null;
  }
}

/**
 * Bounded transaction read for dashboard period calculations. Values are raw
 * ledger events; dashboard selectors remain responsible for financial semantics.
 */
export async function listTransactionsForDateRange(
  startDate: string,
  endDate: string,
): Promise<LedgerTransaction[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || startDate > endDate) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_LIST_SELECT)
      .eq("household_id", gate.householdId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      return null;
    }
    return mapTransactionRows(data ?? []);
  } catch {
    return null;
  }
}

export async function listCategoryTags(
  kind: TransactionDirection,
): Promise<CategoryTag[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, kind, name, household_id, jar_id")
      .eq("kind", kind)
      .eq("is_active", true)
      .or(`household_id.is.null,household_id.eq.${gate.householdId}`)
      .order("sort_order", { ascending: true });
    if (error) {
      return null;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      kind:
        row.kind === Direction.INCOME ? Direction.INCOME : Direction.EXPENSE,
      name: row.name,
      jarId: row.jar_id ?? null,
    }));
  } catch {
    return null;
  }
}

export async function listCaptureJars(): Promise<CaptureJarOption[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jars")
      .select("id, name, kind")
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .eq("is_paused", false)
      .order("sort_order", { ascending: true });
    if (error) {
      return null;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
    }));
  } catch {
    return null;
  }
}
