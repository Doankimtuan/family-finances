import { z } from "zod";
import {
  DebtCreationMode,
  DEBT_CREATION_MODE_VALUES,
  DEBT_DIRECTION_VALUES,
  ISO_DATE_PATTERN,
} from "../ledger-constants";

export const createDebtFormSchema = z
  .object({
    counterparty: z.string().trim().min(1).max(80),
    direction: z.enum(DEBT_DIRECTION_VALUES),
    creationMode: z.enum(DEBT_CREATION_MODE_VALUES),
    principalAmount: z.number().finite().int().positive(),
    startDate: z.string().regex(ISO_DATE_PATTERN),
    dueDate: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
    note: z.string().trim().max(200).optional(),
    accountId: z.string().uuid().nullable().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.creationMode === DebtCreationMode.MONEY_MOVED &&
      value.accountId == null
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["accountId"] });
    }
    if (value.dueDate != null && value.dueDate < value.startDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"] });
    }
  });
export type CreateDebtFormValues = z.infer<typeof createDebtFormSchema>;

export const createDebtInputSchema = createDebtFormSchema.extend({
  name: z.string().trim().min(1).max(80),
  idempotencyKey: z.string().trim().min(1).max(200),
});
export type CreateDebtInput = z.infer<typeof createDebtInputSchema>;

const recordDebtPaymentFieldsSchema = z.object({
  amount: z.number().finite().int().positive(),
  accountId: z.string().uuid(),
  effectiveDate: z.string().regex(ISO_DATE_PATTERN),
  note: z.string().trim().max(200).optional(),
});
export function recordDebtPaymentFormSchema(remainingAmount: number) {
  return recordDebtPaymentFieldsSchema.refine(
    (value) => value.amount <= remainingAmount,
    { path: ["amount"] },
  );
}
export type RecordDebtPaymentFormValues = z.infer<
  typeof recordDebtPaymentFieldsSchema
>;

export const recordDebtPaymentInputSchema =
  recordDebtPaymentFieldsSchema.extend({
    debtId: z.string().uuid(),
    idempotencyKey: z.string().trim().min(1).max(200),
  });
export type RecordDebtPaymentInput = z.infer<
  typeof recordDebtPaymentInputSchema
>;
