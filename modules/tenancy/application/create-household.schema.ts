import { z } from "zod";

export const planPresetSchema = z.enum(["balanced", "simple"]);
export type PlanPreset = z.infer<typeof planPresetSchema>;

export const createHouseholdInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  accountName: z.string().trim().min(1).max(80),
  planPreset: planPresetSchema,
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
