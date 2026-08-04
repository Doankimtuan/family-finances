import { z } from "zod";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  LEDGER_ACTION_ERROR_CODE,
  TRANSACTION_DIRECTION_VALUES,
} from "../ledger-constants";

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

export type UpdateTransactionErrorCode =
  ProductActionErrorCode | typeof LEDGER_ACTION_ERROR_CODE.IMMUTABLE;

export type UpdateTransactionResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: UpdateTransactionErrorCode };

/**
 * BR-02 / BR-03 — posted ledger rows are immutable.
 * Use refundTransaction / correctTransaction instead of in-place mutation.
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

  return { ok: false, code: LEDGER_ACTION_ERROR_CODE.IMMUTABLE };
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

  // BR-02 — ledger entries are immutable; use refund / correct instead.
  return { ok: false, code: LEDGER_ACTION_ERROR_CODE.IMMUTABLE };
}
