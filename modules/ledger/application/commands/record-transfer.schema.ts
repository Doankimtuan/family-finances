import { z } from "zod";
import {
  ISO_DATE_PATTERN,
  TRANSFER_IDEMPOTENCY_KEY_MAX_LEN,
  TRANSFER_IDEMPOTENCY_KEY_MIN_LEN,
} from "../ledger-constants";

/** Client-safe canonical validation for owned-account transfers. */
export const recordTransferInputSchema = z
  .object({
    sourceAccountId: z.string().uuid(),
    destinationAccountId: z.string().uuid(),
    amount: z.number().int().positive(),
    transactionDate: z.string().regex(ISO_DATE_PATTERN).optional(),
    note: z.string().trim().max(500).optional(),
    idempotencyKey: z
      .string()
      .trim()
      .min(TRANSFER_IDEMPOTENCY_KEY_MIN_LEN)
      .max(TRANSFER_IDEMPOTENCY_KEY_MAX_LEN)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceAccountId === value.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationAccountId"],
      });
    }
  });

export type RecordTransferInput = z.infer<typeof recordTransferInputSchema>;
