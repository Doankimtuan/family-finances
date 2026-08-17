import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  AccountType,
  LEDGER_ACTION_ERROR_CODE,
  TransactionDirection,
  type LedgerActionErrorCode,
} from "../ledger-constants";
import { wouldExceedCreditLimit } from "../credit-card-billing";
import {
  assignCardBillingForTransaction,
  loadCardOutstandingAndLimit,
} from "./assign-card-billing";
import {
  recordTransactionInputSchema,
  type RecordTransactionInput,
} from "./record-transaction.schema";

export type RecordTransactionErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

export type RecordTransactionResult =
  | {
      ok: true;
      transactionId: string;
      inboxItemId: string | null;
      idempotent: boolean;
    }
  | { ok: false; code: RecordTransactionErrorCode };

/**
 * Record income/expense with positive magnitude + explicit direction (BR-06).
 * Credit-card expenses are blocked over limit; CC txs assign billing app-layer.
 */
export async function recordTransaction(
  raw: RecordTransactionInput,
): Promise<RecordTransactionResult> {
  const parsed = recordTransactionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: account } = await supabase
      .from("accounts")
      .select("id, type")
      .eq("household_id", gate.householdId)
      .eq("id", parsed.data.accountId)
      .eq("is_archived", false)
      .maybeSingle();

    if (!account) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const isCard = account.type === AccountType.CREDIT_CARD;
    let cardMeta: Awaited<ReturnType<typeof loadCardOutstandingAndLimit>> =
      null;

    if (isCard) {
      cardMeta = await loadCardOutstandingAndLimit({
        householdId: gate.householdId,
        cardAccountId: account.id,
      });
      if (!cardMeta) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }

      if (
        parsed.data.type === TransactionDirection.EXPENSE &&
        wouldExceedCreditLimit(
          cardMeta.creditLimit,
          cardMeta.outstanding,
          parsed.data.amount,
        )
      ) {
        return {
          ok: false,
          code: LEDGER_ACTION_ERROR_CODE.CREDIT_LIMIT_EXCEEDED,
        };
      }
    }

    const txDate =
      parsed.data.transactionDate ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc("record_transaction", {
      p_account_id: parsed.data.accountId,
      p_type: parsed.data.type,
      p_amount: parsed.data.amount,
      p_transaction_date: txDate,
      p_note: parsed.data.note ?? null,
      p_category_id: parsed.data.categoryId ?? null,
      p_jar_id: parsed.data.jarId ?? null,
      p_idempotency_key: parsed.data.idempotencyKey ?? null,
    });

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      transaction_id?: string;
      inbox_item_id?: string | null;
      idempotent?: boolean;
    };

    if (!payload.transaction_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (isCard && cardMeta && !payload.idempotent) {
      const mode =
        parsed.data.type === TransactionDirection.INCOME
          ? "cashback"
          : "expense";
      await assignCardBillingForTransaction({
        householdId: gate.householdId,
        cardAccountId: account.id,
        transactionId: payload.transaction_id,
        amount: parsed.data.amount,
        transactionDate: txDate,
        note: parsed.data.note ?? null,
        mode,
        statementDay: cardMeta.statementDay,
        dueDay: cardMeta.dueDay,
      });
    }

    return {
      ok: true,
      transactionId: payload.transaction_id,
      inboxItemId: payload.inbox_item_id ?? null,
      idempotent: Boolean(payload.idempotent),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
