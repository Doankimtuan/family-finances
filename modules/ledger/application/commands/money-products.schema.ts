import { z } from "zod";
import {
  LoanInterestStrategy,
  LoanRepaymentMethod,
  LoanTermUnit,
  LoanType,
  LOAN_INTEREST_STRATEGY_VALUES,
  LOAN_REPAYMENT_METHOD_VALUES,
  LOAN_TERM_UNIT_VALUES,
  LOAN_TYPE_VALUES,
} from "../ledger-constants";

/** Client-safe canonical validation for creating a loan. */
export const createLoanInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    lender: z.string().trim().max(80).optional(),
    loanType: z.enum(LOAN_TYPE_VALUES).optional().default(LoanType.OTHER),
    principal: z.number().finite().int().positive(),
    annualInterestRate: z.number().finite().min(0).max(100).default(0),
    interestStrategy: z
      .enum(LOAN_INTEREST_STRATEGY_VALUES)
      .optional()
      .default(LoanInterestStrategy.FIXED),
    promoFixedRate: z.number().finite().min(0).max(100).optional().nullable(),
    promoFixedMonths: z.number().int().positive().max(600).optional().nullable(),
    promoFloatingRate: z
      .number()
      .finite()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    promoRateEffectiveOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    repaymentMethod: z
      .enum(LOAN_REPAYMENT_METHOD_VALUES)
      .optional()
      .default(LoanRepaymentMethod.FIXED_MONTHLY),
    termValue: z.number().int().positive().max(600),
    termUnit: z.enum(LOAN_TERM_UNIT_VALUES).optional().default(LoanTermUnit.MONTHS),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    firstPaymentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    note: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.interestStrategy !== LoanInterestStrategy.PROMO_FIXED_TO_FLOATING) {
      return;
    }
    if (data.promoFixedMonths == null || data.promoFixedMonths <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoFixedMonths"] });
    }
    if (data.promoFixedRate == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoFixedRate"] });
    }
    if (data.promoFloatingRate == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promoFloatingRate"] });
    }
  });

export type CreateLoanInput = z.input<typeof createLoanInputSchema>;
