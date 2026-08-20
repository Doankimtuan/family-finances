import { z } from "zod";

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
