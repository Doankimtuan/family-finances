import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { LedgerRpcName, type LedgerActionErrorCode } from "../ledger-constants";
import {
  classifyRefundRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";

export const refundTransactionInputSchema = z.object({
  originalTransactionId: z.string().uuid(),
  /** Positive whole currency units to credit back (BR-06 / BR-02). */
  amount: z.number().int().positive(),
  accountId: z.string().uuid().optional(),
  note: z.string().trim().max(200).optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type RefundTransactionInput = z.infer<
  typeof refundTransactionInputSchema
>;

export type RefundTransactionErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

type RefundTransactionSuccess = {
  refundTransactionId: string;
  originalTransactionId: string;
  originalStatus: string;
  jarId: string | null;
  capacityRestored: number;
};

export type RefundTransactionResult = Result<
  RefundTransactionSuccess,
  RefundTransactionErrorCode
>;

type RefundTransactionRpcPayload = {
  refund_transaction_id: string;
  original_transaction_id: string;
  original_status?: unknown;
  jar_id?: unknown;
  capacity_restored?: unknown;
};

function isRefundTransactionRpcPayload(
  value: unknown,
): value is RefundTransactionRpcPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "refund_transaction_id" in value &&
    "original_transaction_id" in value &&
    typeof value.refund_transaction_id === "string" &&
    typeof value.original_transaction_id === "string"
  );
}

/**
 * Post a refund linked via reverses_transaction_id and restore jar capacity (BR-02).
 */
export async function refundTransaction(
  raw: RefundTransactionInput,
): Promise<RefundTransactionResult> {
  const parsed = refundTransactionInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc(
      LedgerRpcName.REFUND_TRANSACTION,
      {
        p_original_transaction_id: parsed.data.originalTransactionId,
        p_amount: parsed.data.amount,
        p_account_id: parsed.data.accountId ?? null,
        p_note: parsed.data.note ?? null,
        p_transaction_date: parsed.data.transactionDate ?? null,
      },
    );

    if (error) {
      const code = classifyRefundRpcError(error);
      if (code && code !== PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        return { ok: false, code };
      }
      logLedgerFailure(error, LEDGER_OPERATION.REFUND_TRANSACTION, {
        householdId: gate.householdId,
        originalTransactionId: parsed.data.originalTransactionId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (!isRefundTransactionRpcPayload(data)) {
      logLedgerFailure(null, LEDGER_OPERATION.REFUND_TRANSACTION, {
        householdId: gate.householdId,
        originalTransactionId: parsed.data.originalTransactionId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const originalStatus =
      typeof data.original_status === "string" ? data.original_status : "";
    const jarId =
      data.jar_id === null || typeof data.jar_id === "string"
        ? data.jar_id
        : null;
    const capacityCandidate =
      typeof data.capacity_restored === "number" ||
      typeof data.capacity_restored === "string"
        ? Number(data.capacity_restored)
        : Number.NaN;
    const capacityRestored = Number.isFinite(capacityCandidate)
      ? capacityCandidate
      : parsed.data.amount;

    return {
      ok: true,
      refundTransactionId: data.refund_transaction_id,
      originalTransactionId: data.original_transaction_id,
      originalStatus,
      jarId,
      capacityRestored,
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.REFUND_TRANSACTION, {
      householdId: gate.householdId,
      originalTransactionId: parsed.data.originalTransactionId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
