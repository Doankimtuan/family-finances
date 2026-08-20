import { z } from "zod";
import { TRANSACTION_DIRECTION_VALUES } from "../ledger-constants";

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
