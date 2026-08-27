import { z } from "zod";
import type { AccountType as AccountTypeValue } from "@/modules/ledger/application/ledger-constants";
import { isCashSourceAccountType } from "@/modules/ledger/application/account-constants";
import { SavingsFamily, SAVINGS_FAMILY_VALUES } from "./savings-constants";
export { SavingsFamily, SAVINGS_FAMILY_VALUES };
export type { SavingsFamily as SavingsFamilyValue } from "./savings-constants";

export const SavingsTermUnit = {
  DAY: "DAY",
  MONTH: "MONTH",
} as const;
export type SavingsTermUnit =
  (typeof SavingsTermUnit)[keyof typeof SavingsTermUnit];
export const SAVINGS_TERM_UNIT_VALUES = [
  SavingsTermUnit.DAY,
  SavingsTermUnit.MONTH,
] as const;

export const SavingsTaxRule = {
  NONE: "NONE",
  PROFIT_PERCENTAGE: "PROFIT_PERCENTAGE",
} as const;
export type SavingsTaxRule =
  (typeof SavingsTaxRule)[keyof typeof SavingsTaxRule];
export const SAVINGS_TAX_RULE_VALUES = [
  SavingsTaxRule.NONE,
  SavingsTaxRule.PROFIT_PERCENTAGE,
] as const;

export const EarlySettlementRule = {
  NOT_ALLOWED: "NOT_ALLOWED",
  RETURN_PRINCIPAL_ONLY: "RETURN_PRINCIPAL_ONLY",
  PRINCIPAL_ONLY: "RETURN_PRINCIPAL_ONLY",
  CUSTOM_RATE: "CUSTOM_RATE",
  CUSTOM_INTEREST_RATE: "CUSTOM_RATE",
  PENALTY: "PENALTY",
  CUSTOM: "CUSTOM",
  PRODUCT_RULE: "CUSTOM",
} as const;
export type EarlySettlementRule =
  (typeof EarlySettlementRule)[keyof typeof EarlySettlementRule];
export const EARLY_SETTLEMENT_RULE_VALUES = [
  EarlySettlementRule.NOT_ALLOWED,
  EarlySettlementRule.RETURN_PRINCIPAL_ONLY,
  EarlySettlementRule.CUSTOM_RATE,
  EarlySettlementRule.PENALTY,
  EarlySettlementRule.CUSTOM,
] as const;

export const SavingsEventKind = {
  PRINCIPAL_PLACEMENT: "SAVINGS_PRINCIPAL_PLACEMENT",
  PRINCIPAL_RETURN: "SAVINGS_PRINCIPAL_RETURN",
  INTEREST: "SAVINGS_INTEREST",
  TAX: "SAVINGS_TAX",
  FEE: "SAVINGS_FEE",
} as const;
export type SavingsEventKind =
  (typeof SavingsEventKind)[keyof typeof SavingsEventKind];

/** The configured default for new PLATFORM products; persisted on the product. */
export const PLATFORM_DEFAULT_TAX_RATE_PERCENT = 5;
export const DEFAULT_SAVINGS_CURRENCY = "VND";

export const savingsTermSchema = z.object({
  amount: z.number().int().positive(),
  unit: z.enum(SAVINGS_TERM_UNIT_VALUES),
});
export type SavingsTerm = z.infer<typeof savingsTermSchema>;

export const savingsTaxConfigSchema = z.object({
  rule: z.enum(SAVINGS_TAX_RULE_VALUES),
  ratePercent: z.number().finite().min(0).max(100),
});
export type SavingsTaxConfig = z.infer<typeof savingsTaxConfigSchema>;

export const savingsProviderInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  family: z.enum(SAVINGS_FAMILY_VALUES),
  iconKey: z.string().trim().min(1).max(64).default("bank"),
});

export const savingsProductInputSchema = z
  .object({
    providerId: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    term: savingsTermSchema,
    annualInterestRatePercent: z.number().finite().min(0).max(100),
    interestCalculationMethod: z.enum([
      "simple",
      "compound_daily",
      "compound_monthly",
    ]),
    taxRule: z.enum(SAVINGS_TAX_RULE_VALUES),
    taxRatePercent: z.number().finite().min(0).max(100),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
    minAmount: z.number().int().positive().nullable(),
    maxAmount: z.number().int().positive().nullable(),
    settlementRules: z.array(z.string().min(1)).min(1),
    earlySettlementRule: z.enum(EARLY_SETTLEMENT_RULE_VALUES),
    penaltyRules: z.array(z.record(z.string(), z.unknown())).default([]),
    renewableAvailable: z.boolean().default(true),
    supportsPartialSettlement: z.boolean().default(false),
    earlySettlementRatePercent: z
      .number()
      .finite()
      .min(0)
      .max(100)
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.earlySettlementRule === EarlySettlementRule.CUSTOM_RATE &&
      (value.earlySettlementRatePercent == null ||
        value.earlySettlementRatePercent < 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["earlySettlementRatePercent"],
        message: "Early withdrawal rate is required",
      });
    }
  });
export type SavingsProductInput = z.infer<typeof savingsProductInputSchema>;

export function familyForLegacySavingType(value: string): SavingsFamily {
  return value === "bank_deposit" ? SavingsFamily.BANK : SavingsFamily.PLATFORM;
}

export function legacySavingTypeForFamily(family: SavingsFamily): string {
  return family === SavingsFamily.BANK ? "bank_deposit" : "digital_saving";
}

export function defaultTaxConfigForFamily(
  family: SavingsFamily,
): SavingsTaxConfig {
  return family === SavingsFamily.BANK
    ? { rule: SavingsTaxRule.NONE, ratePercent: 0 }
    : {
        rule: SavingsTaxRule.PROFIT_PERCENTAGE,
        ratePercent: PLATFORM_DEFAULT_TAX_RATE_PERCENT,
      };
}

export type SavingsProductDefaults = {
  taxRule: SavingsTaxRule;
  taxRatePercent: number;
  earlySettlementRule: EarlySettlementRule;
  earlySettlementRatePercent: number | null;
};
export function getEarlyWithdrawalDefaults(): Pick<
  SavingsProductDefaults,
  "earlySettlementRule" | "earlySettlementRatePercent"
> {
  return {
    earlySettlementRule: EarlySettlementRule.PRINCIPAL_ONLY,
    earlySettlementRatePercent: null,
  };
}
export function getSavingsProductDefaults(
  family: SavingsFamily,
): SavingsProductDefaults {
  const tax = defaultTaxConfigForFamily(family);
  return {
    taxRule: tax.rule,
    taxRatePercent: tax.ratePercent,
    ...getEarlyWithdrawalDefaults(),
  };
}
export function durationDaysForTerm(term: SavingsTerm): number {
  return term.unit === SavingsTermUnit.MONTH ? term.amount * 30 : term.amount;
}

export function addSavingsTerm(startDate: string, term: SavingsTerm): string {
  const date = new Date(`${startDate}T00:00:00Z`);
  if (term.unit === SavingsTermUnit.MONTH) {
    date.setUTCMonth(date.getUTCMonth() + term.amount);
  } else {
    date.setUTCDate(date.getUTCDate() + term.amount);
  }
  return date.toISOString().slice(0, 10);
}

export function subtractSavingsTerm(
  endDate: string,
  term: SavingsTerm,
): string {
  const date = new Date(`${endDate}T00:00:00Z`);
  if (term.unit === SavingsTermUnit.MONTH) {
    date.setUTCMonth(date.getUTCMonth() - term.amount);
  } else {
    date.setUTCDate(date.getUTCDate() - term.amount);
  }
  return date.toISOString().slice(0, 10);
}

export function minimumSavingsStartDate(
  maturityDate: string,
  term: SavingsTerm,
): string {
  let candidate = subtractSavingsTerm(maturityDate, term);
  while (addSavingsTerm(candidate, term) < maturityDate) {
    candidate = addSavingsTerm(candidate, {
      amount: 1,
      unit: SavingsTermUnit.DAY,
    });
  }
  return candidate;
}

export function taxForInterest(
  grossInterest: number,
  taxRule: SavingsTaxRule,
  taxRatePercent: number,
): number {
  if (
    taxRule !== SavingsTaxRule.PROFIT_PERCENTAGE ||
    grossInterest <= 0 ||
    taxRatePercent <= 0
  ) {
    return 0;
  }
  return Math.floor((grossInterest * taxRatePercent) / 100);
}

export type SettlementBreakdown = {
  principal: number;
  grossInterest: number;
  tax: number;
  fee: number;
  netInterest: number;
  totalCashReceived: number;
  taxRule: SavingsTaxRule;
  taxRatePercent: number;
};

export function calculateSettlementBreakdown(input: {
  principal: number;
  grossInterest: number;
  fee?: number;
  taxRule?: SavingsTaxRule;
  taxRatePercent?: number;
}): SettlementBreakdown {
  const principal = Math.max(0, Math.trunc(input.principal));
  const grossInterest = Math.max(0, Math.trunc(input.grossInterest));
  const fee = Math.max(0, Math.trunc(input.fee ?? 0));
  const taxRule = input.taxRule ?? SavingsTaxRule.NONE;
  const taxRatePercent = Math.max(0, input.taxRatePercent ?? 0);
  const tax = taxForInterest(grossInterest, taxRule, taxRatePercent);
  const netInterest = Math.max(0, grossInterest - tax - fee);
  return {
    principal,
    grossInterest,
    tax,
    fee,
    netInterest,
    totalCashReceived: principal + netInterest,
    taxRule,
    taxRatePercent,
  };
}

export function isEligibleSavingsAccountType(
  type: AccountTypeValue | string,
): boolean {
  return isCashSourceAccountType(type);
}

export function assertCompatibleSavingsAccounts(input: {
  fundingAccountType: AccountTypeValue | string;
  settlementAccountType: AccountTypeValue | string;
  fundingAccountId: string;
  settlementAccountId: string;
}): { ok: true } | { ok: false; reason: "ACCOUNT_TYPE" | "ACCOUNT_SAME" } {
  if (input.fundingAccountId === input.settlementAccountId) {
    return { ok: false, reason: "ACCOUNT_SAME" };
  }
  if (
    !isEligibleSavingsAccountType(input.fundingAccountType) ||
    !isEligibleSavingsAccountType(input.settlementAccountType)
  ) {
    return { ok: false, reason: "ACCOUNT_TYPE" };
  }
  return { ok: true };
}
