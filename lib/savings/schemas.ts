import { z } from "zod";

export const savingsTypeEnum = z.enum(["bank", "third_party"]);
export const savingsInterestTypeEnum = z.enum(["simple", "compound_daily"]);
export const savingsTermModeEnum = z.enum(["fixed", "flexible"]);
export const savingsStatusEnum = z.enum([
  "active",
  "matured",
  "withdrawn",
  "renewed",
]);
export const savingsMaturityPreferenceEnum = z.enum([
  "renew_same",
  "switch_plan",
  "withdraw",
]);

export const savingsListQuerySchema = z.object({
  status: savingsStatusEnum.optional(),
  savingsType: savingsTypeEnum.optional(),
  goalId: z.string().uuid().optional(),
  includeProjection: z.coerce.boolean().default(false),
});

const sharedCreateSchema = z.object({
  providerName: z.string().min(2),
  productName: z.string().trim().max(120).optional(),
  principalAmount: z.number().int().positive(),
  annualRate: z.number().min(0),
  startDate: z.string().date(),
  primaryLinkedAccountId: z.string().uuid(),
  goalId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const createBankSavingsSchema = sharedCreateSchema.extend({
  savingsType: z.literal("bank"),
  termDays: z.number().int().positive(),
  earlyWithdrawalRate: z.number().min(0),
  maturityPreference: z.enum(["renew_same", "withdraw"]),
});

export const createThirdPartySavingsSchema = sharedCreateSchema.extend({
  savingsType: z.literal("third_party"),
  interestType: savingsInterestTypeEnum,
  termMode: savingsTermModeEnum,
  termDays: z.number().int().nonnegative().optional(),
  linkedAccountIds: z.array(z.string().uuid()).min(1),
  maturityPreference: savingsMaturityPreferenceEnum.nullable().optional(),
  taxRate: z.number().min(0).max(1).default(0.05),
});

export const createSavingsSchema = z.discriminatedUnion("savingsType", [
  createBankSavingsSchema,
  createThirdPartySavingsSchema,
]);

export const patchSavingsSchema = z.object({
  goalId: z.string().uuid().nullable().optional(),
  primaryLinkedAccountId: z.string().uuid().optional(),
  linkedAccountIds: z.array(z.string().uuid()).min(1).optional(),
  maturityPreference: savingsMaturityPreferenceEnum.nullable().optional(),
  nextPlanConfig: z
    .object({
      annualRate: z.number().min(0),
      termDays: z.number().int().nonnegative(),
      interestType: savingsInterestTypeEnum,
      taxRate: z.number().min(0).max(1),
      primaryLinkedAccountId: z.string().uuid().optional(),
      linkedAccountIds: z.array(z.string().uuid()).min(1).optional(),
    })
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const withdrawBankSchema = z.object({
  withdrawalDate: z.string().date(),
  destinationAccountId: z.string().uuid(),
  note: z.string().max(2000).optional(),
});

export const withdrawThirdPartySchema = withdrawBankSchema.extend({
  principalAmount: z.number().int().positive(),
});

export const matureSavingsSchema = z.object({
  actionDate: z.string().date(),
  actionType: savingsMaturityPreferenceEnum,
  destinationAccountId: z.string().uuid().optional(),
  newPlan: z
    .object({
      annualRate: z.number().min(0),
      termDays: z.number().int().nonnegative(),
      interestType: savingsInterestTypeEnum,
      taxRate: z.number().min(0).max(1),
      primaryLinkedAccountId: z.string().uuid(),
      linkedAccountIds: z.array(z.string().uuid()).min(1),
    })
    .optional(),
});

export const projectionQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
  projectionDays: z.coerce.number().int().positive().max(3650).optional(),
});
