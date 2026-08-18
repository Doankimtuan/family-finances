import { z } from "zod";
import {
  ACCOUNT_TYPE_VALUES,
  AccountType,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_STATEMENT_DAY,
} from "../ledger-constants";
import {
  FINANCIAL_SCOPE_VALUES,
  FINANCIAL_SCOPE,
} from "@/modules/shared-kernel/application/financial-scope";

const creditCardSettingsSchema = z.object({
  creditLimit: z.number().finite().int().min(0).nullable(),
  statementDay: z
    .number()
    .int()
    .min(1)
    .max(31)
    .default(DEFAULT_CARD_STATEMENT_DAY),
  dueDay: z.number().int().min(1).max(31).default(DEFAULT_CARD_DUE_DAY),
  linkedBankAccountId: z.string().uuid().nullable().optional(),
});

export const createAccountInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(ACCOUNT_TYPE_VALUES).default(AccountType.CASH),
    openingBalance: z.number().finite().int().min(0).default(0),
    financialScope: z
      .enum(FINANCIAL_SCOPE_VALUES)
      .default(FINANCIAL_SCOPE.HOUSEHOLD),
    creditCard: creditCardSettingsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === AccountType.CREDIT_CARD && !value.creditCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "credit_card_settings_required",
        path: ["creditCard"],
      });
    }
  });

export type CreateAccountInput = z.input<typeof createAccountInputSchema>;
