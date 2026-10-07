import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { TransactionReadStatus } from "../ledger-constants";
import {
  mapTransactionRow,
  type LedgerTransaction,
} from "../transaction-types";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import { getTransactionReadResult } from "./get-transaction";

export type TransactionAuditChain = {
  original: LedgerTransaction;
  reversals: LedgerTransaction[];
  corrections: LedgerTransaction[];
};

const TX_SELECT =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, savings_event_kind, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name, type), categories(name, icon_key), jars(name)";

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
    const rootResult = await getTransactionReadResult(transactionId);
    if (rootResult.status !== TransactionReadStatus.OK) return null;

    const root = rootResult.transaction;
    const originalId =
      root.reversesTransactionId ?? root.correctsTransactionId ?? transactionId;
    const originalResult =
      originalId === transactionId
        ? { data: root, error: null }
        : await supabase
            .from("transactions")
            .select(TX_SELECT)
            .eq("household_id", gate.householdId)
            .eq("id", originalId)
            .maybeSingle();

    if (originalResult.error) {
      logLedgerFailure(
        originalResult.error,
        LEDGER_OPERATION.GET_TRANSACTION_AUDIT_CHAIN,
        { householdId: gate.householdId, transactionId },
      );
      return null;
    }
    const originalRow = originalResult.data;

    if (!originalRow) {
      return null;
    }

    const [reversalResult, correctionResult] = await Promise.all([
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

    if (reversalResult.error || correctionResult.error) {
      for (const error of [reversalResult.error, correctionResult.error]) {
        if (error) {
          logLedgerFailure(
            error,
            LEDGER_OPERATION.GET_TRANSACTION_AUDIT_CHAIN,
            { householdId: gate.householdId, transactionId },
          );
        }
      }
      return null;
    }

    return {
      original:
        originalId === transactionId
          ? root
          : normalize(originalRow as Record<string, unknown>),
      reversals: (reversalResult.data ?? []).map((row) =>
        normalize(row as Record<string, unknown>),
      ),
      corrections: (correctionResult.data ?? []).map((row) =>
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
