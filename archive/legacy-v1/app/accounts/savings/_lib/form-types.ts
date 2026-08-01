import { z } from "zod";
import { savingsFormSchema } from "./form-schema";

export type AccountOption = { id: string; name: string };
export type GoalOption = { id: string; name: string };
export type JarOption = { id: string; name: string };

export type SavingsFormState = z.infer<typeof savingsFormSchema>;

export type SavingsPreview = {
  accrued: number;
  tax: number;
  net: number;
  termDays: number;
};
