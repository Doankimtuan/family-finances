import { z } from "zod";

export const PlanPreset = {
  BALANCED: "balanced",
  SIMPLE: "simple",
} as const;

export type PlanPreset = (typeof PlanPreset)[keyof typeof PlanPreset];

export const PLAN_PRESET_VALUES = [
  PlanPreset.BALANCED,
  PlanPreset.SIMPLE,
] as const;

export const planPresetSchema = z.enum(PLAN_PRESET_VALUES);

export const createHouseholdInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  accountName: z.string().trim().min(1).max(80).optional(),
  openingBalance: z.number().finite().int().min(0).default(0),
  planPreset: planPresetSchema.nullable().optional(),
  locale: z.string().trim().min(2).max(16).optional(),
  timezone: z.string().trim().min(2).max(64).optional(),
  baseCurrency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/)
    .transform((v) => v.toUpperCase())
    .optional(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdInputSchema>;
