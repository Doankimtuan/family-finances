import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { TRANSACTION_DIRECTION_VALUES } from "../ledger-constants";

export const recordTransactionInputSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(TRANSACTION_DIRECTION_VALUES),
  /** Positive whole currency units (BR-06). */
  amount: z.number().int().positive(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  jarId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().uuid().optional(),
});

export type RecordTransactionInput = z.infer<
  typeof recordTransactionInputSchema
>;

export type RecordTransactionErrorCode = ProductActionErrorCode;

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
 * Unmapped expense → Inbox (BR-05); Suggest income path → Inbox (BR-04).
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
    const { data, error } = await supabase.rpc("record_transaction", {
      p_account_id: parsed.data.accountId,
      p_type: parsed.data.type,
      p_amount: parsed.data.amount,
      p_transaction_date:
        parsed.data.transactionDate ?? new Date().toISOString().slice(0, 10),
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
