import { SupabaseClient } from "@supabase/supabase-js";
import {
  allocateExpenseTransaction,
  allocateIncomeTransaction,
  computeIncomeAllocationSuggestions,
} from "../domain/allocation-engine";

export { computeIncomeAllocationSuggestions };

export async function syncTransactionToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    transactionId: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    transactionDate: string;
    categoryId: string | null;
    description?: string | null;
  },
) {
  if (input.type === "expense") {
    const result = await allocateExpenseTransaction(supabase, {
      householdId: input.householdId,
      userId: input.userId,
      transactionId: input.transactionId,
      amount: input.amount,
      transactionDate: input.transactionDate,
      categoryId: input.categoryId,
      description: input.description,
    });
    return { queued: result.queued };
  }

  if (input.type === "income") {
    const result = await allocateIncomeTransaction(supabase, {
      householdId: input.householdId,
      userId: input.userId,
      transactionId: input.transactionId,
      amount: input.amount,
      transactionDate: input.transactionDate,
      categoryId: input.categoryId,
      description: input.description,
    });
    return { queued: result.queued };
  }

  return { queued: false };
}
