import { z } from "zod";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { TRANSACTION_DIRECTION_VALUES } from "../ledger-constants";

/** Note length cap shared by the schema and the capture UI field. */
export const TRANSACTION_NOTE_MAX_LENGTH = 200;

/**
 * Client-safe Zod schema for recording income/expense (BR-06).
 * Kept out of the server command module so client barrels stay free of `server-only`.
 */
export const recordTransactionInputSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(TRANSACTION_DIRECTION_VALUES),
  /** Positive whole currency units (BR-06); one shared message for all amount rules. */
  amount: z
    .number({ message: PRODUCT_ACTION_ERROR_CODE.INVALID })
    .int({ message: PRODUCT_ACTION_ERROR_CODE.INVALID })
    .positive({ message: PRODUCT_ACTION_ERROR_CODE.INVALID }),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z
    .string()
    .trim()
    .max(TRANSACTION_NOTE_MAX_LENGTH, {
      message: PRODUCT_ACTION_ERROR_CODE.INVALID,
    })
    .optional(),
  categoryId: z.string().uuid().optional().nullable(),
  jarId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().uuid().optional(),
});

export type RecordTransactionInput = z.infer<
  typeof recordTransactionInputSchema
>;
