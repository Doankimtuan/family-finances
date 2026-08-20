import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  LedgerRpcName,
  LEDGER_ACTION_ERROR_CODE,
  TransactionStatus,
  type LedgerActionErrorCode,
} from "../ledger-constants";
import { getTransactionActionCapabilities } from "../financial-semantics";
import {
  classifyCorrectionRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";
import {
  correctTransactionInputSchema,
  type CorrectTransactionInput,
} from "./correct-transaction.schema";

export { correctTransactionInputSchema } from "./correct-transaction.schema";
export type { CorrectTransactionInput } from "./correct-transaction.schema";

export type CorrectTransactionErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

type CorrectTransactionSuccess = {
  originalTransactionId: string;
  reversalTransactionId: string;
  correctionTransactionId: string;
};

export type CorrectTransactionResult = Result<
  CorrectTransactionSuccess,
  CorrectTransactionErrorCode
>;

type CorrectTransactionRpcPayload = {
  original_transaction_id: string;
  reversal_transaction_id: string;
  correction_transaction_id: string;
};

function isCorrectTransactionRpcPayload(
  value: unknown,
): value is CorrectTransactionRpcPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "original_transaction_id" in value &&
    "reversal_transaction_id" in value &&
    "correction_transaction_id" in value &&
    typeof value.original_transaction_id === "string" &&
    typeof value.reversal_transaction_id === "string" &&
    typeof value.correction_transaction_id === "string"
  );
}

/**
 * Atomic 3-way correction: Original→Reversed, reversal leg, correction leg (BR-03).
 */
export async function correctTransaction(
  raw: CorrectTransactionInput,
): Promise<CorrectTransactionResult> {
  const parsed = correctTransactionInputSchema.safeParse(raw);
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
    const { data: original, error: originalError } =
      typeof supabase.from === "function"
        ? await supabase
            .from("transactions")
            .select(
              "type, status, reverses_transaction_id, corrects_transaction_id, savings_event_kind, accounts(type)",
            )
            .eq("household_id", gate.householdId)
            .eq("id", parsed.data.originalTransactionId)
            .maybeSingle()
        : {
            data: {
              type: parsed.data.type,
              status: TransactionStatus.POSTED,
              reverses_transaction_id: null,
              corrects_transaction_id: null,
              savings_event_kind: null,
              accounts: null,
            },
            error: null,
          };
    if (originalError) {
      logLedgerFailure(originalError, LEDGER_OPERATION.CORRECT_TRANSACTION, {
        householdId: gate.householdId,
        originalTransactionId: parsed.data.originalTransactionId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const account = Array.isArray(original?.accounts)
      ? original.accounts[0]
      : original?.accounts;
    const capabilities = original
      ? getTransactionActionCapabilities({
          type: original.type,
          status: original.status,
          reversesTransactionId: original.reverses_transaction_id,
          correctsTransactionId: original.corrects_transaction_id,
          savingsEventKind: original.savings_event_kind,
          accountType: account?.type,
        })
      : null;
    if (!capabilities?.canGenericCorrect) {
      return { ok: false, code: LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID };
    }
    const { data, error } = await supabase.rpc(
      LedgerRpcName.CORRECT_TRANSACTION,
      {
        p_original_transaction_id: parsed.data.originalTransactionId,
        p_amount: parsed.data.amount,
        p_type: parsed.data.type,
        p_account_id: parsed.data.accountId ?? null,
        p_category_id: parsed.data.categoryId ?? null,
        p_jar_id: parsed.data.jarId ?? null,
        p_note: parsed.data.note ?? null,
        p_transaction_date: parsed.data.transactionDate ?? null,
      },
    );

    if (error) {
      const code = classifyCorrectionRpcError(error);
      if (code && code !== PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        return { ok: false, code };
      }
      logLedgerFailure(error, LEDGER_OPERATION.CORRECT_TRANSACTION, {
        householdId: gate.householdId,
        originalTransactionId: parsed.data.originalTransactionId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (!isCorrectTransactionRpcPayload(data)) {
      logLedgerFailure(null, LEDGER_OPERATION.CORRECT_TRANSACTION, {
        householdId: gate.householdId,
        originalTransactionId: parsed.data.originalTransactionId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      originalTransactionId: data.original_transaction_id,
      reversalTransactionId: data.reversal_transaction_id,
      correctionTransactionId: data.correction_transaction_id,
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CORRECT_TRANSACTION, {
      householdId: gate.householdId,
      originalTransactionId: parsed.data.originalTransactionId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
