import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  LEDGER_ACTION_ERROR_CODE,
  type LedgerActionErrorCode,
} from "../ledger-constants";

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

export type RefundTransactionResult =
  | {
      ok: true;
      refundTransactionId: string;
      originalTransactionId: string;
      originalStatus: string;
      jarId: string | null;
      capacityRestored: number;
    }
  | { ok: false; code: RefundTransactionErrorCode };

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
    const { data, error } = await supabase.rpc("refund_transaction", {
      p_original_transaction_id: parsed.data.originalTransactionId,
      p_amount: parsed.data.amount,
      p_account_id: parsed.data.accountId ?? null,
      p_note: parsed.data.note ?? null,
      p_transaction_date: parsed.data.transactionDate ?? null,
    });

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: LEDGER_ACTION_ERROR_CODE.REFUND_INVALID };
    }

    const payload = data as {
      refund_transaction_id?: string;
      original_transaction_id?: string;
      original_status?: string;
      jar_id?: string | null;
      capacity_restored?: number;
    };

    if (!payload.refund_transaction_id || !payload.original_transaction_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      refundTransactionId: payload.refund_transaction_id,
      originalTransactionId: payload.original_transaction_id,
      originalStatus: payload.original_status ?? "",
      jarId: payload.jar_id ?? null,
      capacityRestored: Number(payload.capacity_restored ?? parsed.data.amount),
    };
  } catch {
    return { ok: false, code: LEDGER_ACTION_ERROR_CODE.REFUND_INVALID };
  }
}
