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
      .select(
        "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, created_at, accounts(name), categories(name), jars(name)",
      )
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
    return (data ?? []).map((row) =>
      mapTransactionRow({
        ...row,
        accounts: Array.isArray(row.accounts) ? row.accounts[0] : row.accounts,
        categories: Array.isArray(row.categories)
          ? row.categories[0]
          : row.categories,
        jars: Array.isArray(row.jars) ? row.jars[0] : row.jars,
      }),
    );
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
      .select("id, kind, name, household_id")
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
