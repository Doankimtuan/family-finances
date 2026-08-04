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
  TRANSACTION_DIRECTION_VALUES,
  type LedgerActionErrorCode,
} from "../ledger-constants";

export const correctTransactionInputSchema = z.object({
  originalTransactionId: z.string().uuid(),
  amount: z.number().int().positive(),
  type: z.enum(TRANSACTION_DIRECTION_VALUES),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  jarId: z.string().uuid().optional().nullable(),
  note: z.string().trim().max(200).optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CorrectTransactionInput = z.infer<
  typeof correctTransactionInputSchema
>;

export type CorrectTransactionErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

export type CorrectTransactionResult =
  | {
      ok: true;
      originalTransactionId: string;
      reversalTransactionId: string;
      correctionTransactionId: string;
    }
  | { ok: false; code: CorrectTransactionErrorCode };

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
    const { data, error } = await supabase.rpc("correct_transaction", {
      p_original_transaction_id: parsed.data.originalTransactionId,
      p_amount: parsed.data.amount,
      p_type: parsed.data.type,
      p_account_id: parsed.data.accountId ?? null,
      p_category_id: parsed.data.categoryId ?? null,
      p_jar_id: parsed.data.jarId ?? null,
      p_note: parsed.data.note ?? null,
      p_transaction_date: parsed.data.transactionDate ?? null,
    });

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID };
    }

    const payload = data as {
      original_transaction_id?: string;
      reversal_transaction_id?: string;
      correction_transaction_id?: string;
    };

    if (
      !payload.original_transaction_id ||
      !payload.reversal_transaction_id ||
      !payload.correction_transaction_id
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      originalTransactionId: payload.original_transaction_id,
      reversalTransactionId: payload.reversal_transaction_id,
      correctionTransactionId: payload.correction_transaction_id,
    };
  } catch {
    return { ok: false, code: LEDGER_ACTION_ERROR_CODE.CORRECTION_INVALID };
  }
}
