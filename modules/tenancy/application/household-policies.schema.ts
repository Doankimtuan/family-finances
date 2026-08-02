import { z } from "zod";

export const overspendPolicySchema = z.enum([
  "warn",
  "block",
  "allow_negative",
]);
export type OverspendPolicy = z.infer<typeof overspendPolicySchema>;

export const monthCloseModeSchema = z.enum(["assisted", "auto", "manual"]);
export type MonthCloseMode = z.infer<typeof monthCloseModeSchema>;

export const incomeAllocateModeSchema = z.enum(["off", "suggest", "auto"]);
export type IncomeAllocateMode = z.infer<typeof incomeAllocateModeSchema>;

export const householdPoliciesInputSchema = z.object({
  overspendPolicy: overspendPolicySchema,
  monthCloseMode: monthCloseModeSchema,
  incomeAllocateMode: incomeAllocateModeSchema,
});

export type HouseholdPoliciesInput = z.infer<
  typeof householdPoliciesInputSchema
>;
