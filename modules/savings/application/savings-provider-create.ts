import { z } from "zod";
import {
  getSavingsProductDefaults,
  savingsProviderInputSchema,
  savingsProductInputSchema,
  SavingsTermUnit,
} from "./savings-domain-rules";
import {
  InterestCalcMethod,
  SAVINGS_PROVIDER_CREATE_DEFAULTS,
  SETTLEMENT_RULE_VALUES,
} from "./savings-constants";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";

export const savingsProviderCreateSchema = savingsProviderInputSchema.extend({
  iconKey: savingsProviderInputSchema.shape.iconKey.removeDefault(),
  packageName: savingsProductInputSchema.shape.name.or(z.literal("")),
  term: savingsProductInputSchema.shape.term,
  annualInterestRatePercent:
    savingsProductInputSchema.shape.annualInterestRatePercent,
});

export type SavingsProviderCreateInput = z.infer<
  typeof savingsProviderCreateSchema
>;

export function savingsProviderCreateDefaults(): SavingsProviderCreateInput {
  const { termAmount, ...defaults } = SAVINGS_PROVIDER_CREATE_DEFAULTS;
  return {
    ...defaults,
    term: { amount: termAmount, unit: SavingsTermUnit.MONTH },
  };
}

export function initialSavingsProduct(
  input: SavingsProviderCreateInput,
  providerId: string,
) {
  if (!input.packageName) return null;
  return {
    providerId,
    name: input.packageName,
    term: input.term,
    annualInterestRatePercent: input.annualInterestRatePercent,
    interestCalculationMethod: InterestCalcMethod.SIMPLE,
    ...getSavingsProductDefaults(input.family),
    currency: DEFAULT_CURRENCY,
    minAmount: null,
    maxAmount: null,
    settlementRules: [...SETTLEMENT_RULE_VALUES],
    penaltyRules: [],
    renewableAvailable: true,
    supportsPartialSettlement: false,
  };
}
