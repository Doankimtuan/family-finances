import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { TRANSACTION_DIRECTION_VALUES } from "../ledger-constants";

export const updateTransactionInputSchema = z.object({
  transactionId: z.string().uuid(),
  accountId: z.string().uuid(),
  type: z.enum(TRANSACTION_DIRECTION_VALUES),
  amount: z.number().int().positive(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  jarId: z.string().uuid().optional().nullable(),
});

export type UpdateTransactionInput = z.infer<
  typeof updateTransactionInputSchema
>;

export type UpdateTransactionErrorCode = ProductActionErrorCode;

export type UpdateTransactionResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: UpdateTransactionErrorCode };

/**
 * Correct a ledger entry — positive magnitude + explicit direction (BR-06).
 */
export async function updateTransaction(
  raw: UpdateTransactionInput,
): Promise<UpdateTransactionResult> {
  const parsed = updateTransactionInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("update_transaction", {
      p_transaction_id: parsed.data.transactionId,
      p_account_id: parsed.data.accountId,
      p_type: parsed.data.type,
      p_amount: parsed.data.amount,
      p_transaction_date: parsed.data.transactionDate ?? null,
      p_note: parsed.data.note ?? null,
      p_category_id: parsed.data.categoryId ?? null,
      p_jar_id: parsed.data.jarId ?? null,
    });

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { transaction_id?: string };
    if (!payload.transaction_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, transactionId: payload.transaction_id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const deleteTransactionInputSchema = z.object({
  transactionId: z.string().uuid(),
});

export type DeleteTransactionInput = z.infer<
  typeof deleteTransactionInputSchema
>;

export type DeleteTransactionResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: UpdateTransactionErrorCode };

export async function deleteTransaction(
  raw: DeleteTransactionInput,
): Promise<DeleteTransactionResult> {
  const parsed = deleteTransactionInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("delete_transaction", {
      p_transaction_id: parsed.data.transactionId,
    });

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { transaction_id?: string };
    if (!payload.transaction_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, transactionId: payload.transaction_id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
