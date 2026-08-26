import { z } from "zod";
import {
  INTEREST_CALC_METHOD_VALUES,
  InterestCalcMethod,
  MATURITY_TARGET_MODE_VALUES,
  MaturityFallbackPolicy,
  PENALTY_STRATEGY_VALUES,
  PenaltyStrategy,
  RENEWAL_POLICY_VALUES,
  RenewalPolicy,
  SETTLEMENT_RULE_VALUES,
  SettlementRule,
  SavingsCreateMode,
  SAVINGS_TERMS_MODE_VALUES,
  SavingsTermsMode,
} from "../savings-constants";
import {
  EARLY_SETTLEMENT_RULE_VALUES,
  EarlySettlementRule,
  SAVINGS_TAX_RULE_VALUES,
  SAVINGS_TERM_UNIT_VALUES,
} from "../savings-domain-rules";
import {
  FINANCIAL_SCOPE,
  FINANCIAL_SCOPE_VALUES,
} from "@/modules/shared-kernel/application/financial-scope";
import { todayIsoDate } from "@/shared/utils/iso-date";

export const renewalConfigSchema = z.object({
  preferredPackageId: z.string().uuid().nullable().optional(),
  preferredSettlementRule: z.enum(SETTLEMENT_RULE_VALUES).optional(),
  preferredSettlementAccountId: z.string().uuid().nullable().optional(),
  targetMode: z.enum(MATURITY_TARGET_MODE_VALUES).optional(),
  targetPackageId: z.string().uuid().nullable().optional(),
  payoutAccountId: z.string().uuid().nullable().optional(),
  fallbackPolicy: z.literal(MaturityFallbackPolicy.ASK_USER).optional(),
});

const commonCreateSavingInputSchema = z.object({
  financialScope: z
    .enum(FINANCIAL_SCOPE_VALUES)
    .default(FINANCIAL_SCOPE.HOUSEHOLD),
  settlementAccountId: z.string().uuid(),
  principal: z.number().finite().int().positive(),
  renewalPolicy: z
    .enum(RENEWAL_POLICY_VALUES)
    .default(RenewalPolicy.ALWAYS_ASK),
  /** @deprecated Use renewalPolicy. */
  renewalPreference: z.enum(RENEWAL_POLICY_VALUES).optional(),
  renewalConfig: renewalConfigSchema.optional(),
  settlementRule: z
    .enum(SETTLEMENT_RULE_VALUES)
    .default(SettlementRule.WITHDRAW_EVERYTHING),
  interestCalcMethod: z
    .enum(INTEREST_CALC_METHOD_VALUES)
    .default(InterestCalcMethod.SIMPLE),
  penaltyStrategy: z
    .enum(PENALTY_STRATEGY_VALUES)
    .default(PenaltyStrategy.NO_INTEREST),
  idempotencyKey: z.string().uuid().optional(),
});

const manualTermsSchema = z.object({
  packageName: z.string().trim().min(1).max(120),
  termAmount: z.number().int().positive(),
  termUnit: z.enum(SAVINGS_TERM_UNIT_VALUES),
  annualInterestRate: z.number().finite().min(0).max(100),
  interestCalculationMethod: z.enum(INTEREST_CALC_METHOD_VALUES),
  taxRule: z.enum(SAVINGS_TAX_RULE_VALUES),
  taxRatePercent: z.number().finite().min(0).max(100),
  earlySettlementRule: z.enum(EARLY_SETTLEMENT_RULE_VALUES),
  earlySettlementRatePercent: z
    .number()
    .finite()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  settlementRules: z.array(z.enum(SETTLEMENT_RULE_VALUES)).min(1),
  penaltyRules: z
    .array(
      z.object({
        strategy: z.enum(PENALTY_STRATEGY_VALUES),
        demandRate: z.number().optional(),
        fixedAmount: z.number().optional(),
        formulaExpression: z.string().optional(),
      }),
    )
    .default([]),
  renewableAvailable: z.boolean().default(true),
  supportsPartialSettlement: z.boolean().default(false),
  minAmount: z.number().int().positive().nullable().default(null),
  maxAmount: z.number().int().positive().nullable().default(null),
});

const historicalCreateSavingInputSchema = commonCreateSavingInputSchema
  .extend({
    creationMode: z.literal(SavingsCreateMode.HISTORICAL_OPENING),
    fundingAccountId: z.literal(null),
    providerId: z.string().uuid().nullable(),
    providerName: z.string().trim().min(1).max(120).nullable().optional(),
    productName: z.string().trim().min(1).max(120),
    packageId: z.string().uuid().nullable(),
    termsMode: z
      .enum(SAVINGS_TERMS_MODE_VALUES)
      .default(SavingsTermsMode.CATALOG),
    manualTerms: manualTermsSchema.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((value, ctx) => {
    if (value.providerId == null && !value.providerName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["providerName"] });
    }
    if (
      value.termsMode === SavingsTermsMode.CATALOG &&
      (value.packageId == null || value.providerId == null)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["packageId"] });
    }
    if (
      value.termsMode === SavingsTermsMode.INLINE &&
      value.manualTerms == null
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["manualTerms"] });
    }
    if (value.startDate >= todayIsoDate()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"] });
    }
    if (
      value.manualTerms?.earlySettlementRule ===
        EarlySettlementRule.CUSTOM_RATE &&
      value.manualTerms.earlySettlementRatePercent == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualTerms", "earlySettlementRatePercent"],
      });
    }
  });

const liveCreateSavingInputSchema = commonCreateSavingInputSchema.extend({
  creationMode: z
    .literal(SavingsCreateMode.LIVE_DEPOSIT)
    .default(SavingsCreateMode.LIVE_DEPOSIT),
  fundingAccountId: z.string().uuid(),
  settlementAccountId: z.string().uuid(),
  providerId: z.string().uuid(),
  packageId: z.string().uuid(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const createSavingCommonInputSchema = commonCreateSavingInputSchema;
export const createSavingInputSchema = z.preprocess(
  (value) =>
    value != null && typeof value === "object"
      ? {
          ...(value as Record<string, unknown>),
          creationMode:
            (value as Record<string, unknown>).creationMode ??
            SavingsCreateMode.LIVE_DEPOSIT,
        }
      : value,
  z.discriminatedUnion("creationMode", [
    liveCreateSavingInputSchema,
    historicalCreateSavingInputSchema,
  ]),
);

export type CreateSavingInput = z.input<typeof createSavingInputSchema>;
export type CreateSavingParsed = z.output<typeof createSavingInputSchema>;
