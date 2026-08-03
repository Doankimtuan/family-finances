import { z } from "zod";
import {
  INCOME_ALLOCATE_MODE_VALUES,
  RITUAL_MODE_VALUES,
} from "@/modules/plan/application/plan-constants";

export const OverspendPolicy = {
  WARN: "warn",
  BLOCK: "block",
  ALLOW_NEGATIVE: "allow_negative",
} as const;

export type OverspendPolicy =
  (typeof OverspendPolicy)[keyof typeof OverspendPolicy];

export const OVERSPEND_POLICY_VALUES = [
  OverspendPolicy.WARN,
  OverspendPolicy.BLOCK,
  OverspendPolicy.ALLOW_NEGATIVE,
] as const;

export const overspendPolicySchema = z.enum(OVERSPEND_POLICY_VALUES);

export const monthCloseModeSchema = z.enum(RITUAL_MODE_VALUES);
export type MonthCloseMode = z.infer<typeof monthCloseModeSchema>;

export const incomeAllocateModeSchema = z.enum(INCOME_ALLOCATE_MODE_VALUES);
export type IncomeAllocateMode = z.infer<typeof incomeAllocateModeSchema>;

export const householdPoliciesInputSchema = z.object({
  overspendPolicy: overspendPolicySchema,
  monthCloseMode: monthCloseModeSchema,
  incomeAllocateMode: incomeAllocateModeSchema,
});

export type HouseholdPoliciesInput = z.infer<
  typeof householdPoliciesInputSchema
>;
