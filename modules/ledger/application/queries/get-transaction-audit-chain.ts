import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapTransactionRow,
  type LedgerTransaction,
} from "../transaction-types";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

export type TransactionAuditChain = {
  original: LedgerTransaction;
  reversals: LedgerTransaction[];
  corrections: LedgerTransaction[];
};

const TX_SELECT =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name), categories(name), jars(name)";

function normalize(row: Record<string, unknown>): LedgerTransaction {
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

/**
 * Load original + linked refund/reversal/correction legs for audit UI (BR-02/03).
 */
export async function getTransactionAuditChain(
  transactionId: string,
): Promise<TransactionAuditChain | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !transactionId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: root, error } = await supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !root) {
      if (error) {
        logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION_AUDIT_CHAIN, {
          householdId: gate.householdId,
          transactionId,
        });
      }
      return null;
    }

    const originalId =
      (root as { reverses_transaction_id?: string | null })
        .reverses_transaction_id ??
      (root as { corrects_transaction_id?: string | null })
        .corrects_transaction_id ??
      transactionId;

    const { data: originalRow } =
      originalId === transactionId
        ? { data: root }
        : await supabase
            .from("transactions")
            .select(TX_SELECT)
            .eq("household_id", gate.householdId)
            .eq("id", originalId)
            .maybeSingle();

    if (!originalRow) {
      return null;
    }

    const [{ data: reversals }, { data: corrections }] = await Promise.all([
      supabase
        .from("transactions")
        .select(TX_SELECT)
        .eq("household_id", gate.householdId)
        .eq("reverses_transaction_id", originalId)
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select(TX_SELECT)
        .eq("household_id", gate.householdId)
        .eq("corrects_transaction_id", originalId)
        .order("created_at", { ascending: true }),
    ]);

    return {
      original: normalize(originalRow as Record<string, unknown>),
      reversals: (reversals ?? []).map((row) =>
        normalize(row as Record<string, unknown>),
      ),
      corrections: (corrections ?? []).map((row) =>
        normalize(row as Record<string, unknown>),
      ),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION_AUDIT_CHAIN, {
      householdId: gate.householdId,
      transactionId,
    });
    return null;
  }
}
