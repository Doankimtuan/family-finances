import { z } from "zod";

export const savingsFormSchema = z.object({
  savingsType: z.enum(["bank", "third_party"]),
  providerName: z.string().min(1, "Provider name is required"),
  productName: z.string().optional(),
  principalAmount: z.number().positive("Amount must be positive"),
  annualRate: z.number().min(0, "Rate cannot be negative"),
  startDate: z.string().min(1, "Start date is required"),
  primaryLinkedAccountId: z.string().min(1, "Primary account is required"),
  linkedAccountIds: z.array(z.string()),
  termMode: z.enum(["fixed", "flexible"]),
  termDays: z.number(),
  earlyWithdrawalRate: z.number(),
  maturityPreference: z.enum(["renew_same", "switch_plan", "withdraw"]),
  taxRate: z.number(),
  interestType: z.enum(["simple", "compound_daily"]),
  sourceJarId: z.string().optional(),
  goalId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.savingsType === "bank" || data.termMode === "fixed") {
    return data.termDays > 0;
  }
  return true;
}, {
  message: "Term days must be greater than 0",
  path: ["termDays"],
});

export type SavingsFormValues = z.infer<typeof savingsFormSchema>;
