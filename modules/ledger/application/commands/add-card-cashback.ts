import { z } from "zod";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { TransactionDirection } from "../ledger-constants";
import type { LedgerActionErrorCode } from "../ledger-constants";
import {
  recordTransaction,
  type RecordTransactionResult,
} from "./record-transaction";

export const addCardCashbackInputSchema = z.object({
  cardAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  note: z.string().trim().max(200).optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type AddCardCashbackInput = z.infer<typeof addCardCashbackInputSchema>;

export type AddCardCashbackResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: ProductActionErrorCode | LedgerActionErrorCode };

/**
 * Record cashback as income on the credit card (routes to latest unpaid cycle).
 */
export async function addCardCashback(
  raw: AddCardCashbackInput,
): Promise<AddCardCashbackResult> {
  const parsed = addCardCashbackInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const result: RecordTransactionResult = await recordTransaction({
    accountId: parsed.data.cardAccountId,
    type: TransactionDirection.INCOME,
    amount: parsed.data.amount,
    note: parsed.data.note ?? "Cashback",
    transactionDate: parsed.data.transactionDate,
  });

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, transactionId: result.transactionId };
}
