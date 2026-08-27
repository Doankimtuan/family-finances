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
} from "../savings-constants";
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
  productName: z.string().trim().min(1).max(120),
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

const historicalCreateSavingInputSchema = commonCreateSavingInputSchema
  .extend({
    creationMode: z.literal(SavingsCreateMode.HISTORICAL_OPENING),
    fundingAccountId: z.literal(null),
    providerId: z.string().uuid(),
    packageId: z.string().uuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((value, ctx) => {
    if (value.startDate >= todayIsoDate()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"] });
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
