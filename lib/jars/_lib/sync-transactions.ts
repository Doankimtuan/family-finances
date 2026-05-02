import { SupabaseClient } from "@supabase/supabase-js";
import { JarSuggestion } from "./types";
import { toMonthStart } from "./utils";
import { createJarMovement, upsertJarReviewQueue } from "./core";
import { getExpenseRuleJarId } from "./queries";

export async function computeIncomeAllocationSuggestions(
  supabase: SupabaseClient,
  householdId: string,
  amount: number,
  movementDate: string,
) {
  const month = toMonthStart(movementDate);
  const [plansResult, jarsResult, balancesResult] = await Promise.all([
    supabase
      .from("jar_month_plans")
      .select("jar_id, fixed_amount, income_percent")
      .eq("household_id", householdId)
      .eq("month", month),
    supabase
      .from("jars")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false),
    supabase
      .from("jar_balances_monthly")
      .select("jar_id, inflow_amount")
      .eq("household_id", householdId)
      .eq("month", month),
  ]);
  if (plansResult.error) throw new Error(plansResult.error.message);
  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);

  const jarNameMap = new Map(
    (jarsResult.data ?? []).map((row) => [row.id, row.name]),
  );
  const alreadyInflowMap = new Map(
    (
      (balancesResult.data ?? []) as Array<{
        jar_id: string;
        inflow_amount: number;
      }>
    ).map((row) => [row.jar_id, Math.round(Number(row.inflow_amount ?? 0))]),
  );

  let remaining = Math.round(amount);
  const suggestions: JarSuggestion[] = [];
  const plans = (plansResult.data ?? []) as Array<{
    jar_id: string;
    fixed_amount: number;
    income_percent: number;
  }>;

  for (const plan of plans.filter(
    (row) => Number(row.income_percent ?? 0) > 0,
  )) {
    const suggested = Math.round(
      (remaining * Number(plan.income_percent ?? 0)) / 100,
    );
    if (suggested <= 0) continue;
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: `Theo ty le ${Number(plan.income_percent ?? 0).toFixed(0)}%`,
    });
  }

  const percentAllocated = suggestions.reduce((sum, row) => sum + row.amount, 0);
  remaining = Math.max(0, Math.round(amount) - percentAllocated);

  for (const plan of plans.filter((row) => Number(row.fixed_amount ?? 0) > 0)) {
    const currentMonthInflow = alreadyInflowMap.get(plan.jar_id) ?? 0;
    const gap = Math.max(
      0,
      Math.round(Number(plan.fixed_amount ?? 0)) - currentMonthInflow,
    );
    if (gap <= 0 || remaining <= 0) continue;
    const suggested = Math.min(gap, remaining);
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: "Bo sung muc tieu thang",
    });
    remaining -= suggested;
  }

  return suggestions.filter((row) => row.amount > 0);
}

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
    const jarId = await getExpenseRuleJarId(
      supabase,
      input.householdId,
      input.categoryId,
    );
    if (jarId) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId,
        movementDate: input.transactionDate,
        amount: input.amount,
        balanceDelta: -1,
        locationFrom: "cash",
        locationTo: "expense",
        sourceType: "expense_transaction",
        sourceId: input.transactionId,
        relatedTransactionId: input.transactionId,
        note: input.description ?? null,
        createdBy: input.userId,
      });
      return { queued: false };
    }

    await upsertJarReviewQueue(supabase, {
      householdId: input.householdId,
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      movementDate: input.transactionDate,
      amount: input.amount,
      contextJson: {
        transactionType: input.type,
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });
    return { queued: true };
  }

  if (input.type === "income") {
    const suggestions = await computeIncomeAllocationSuggestions(
      supabase,
      input.householdId,
      input.amount,
      input.transactionDate,
    );
    await upsertJarReviewQueue(supabase, {
      householdId: input.householdId,
      sourceType: "income_transaction",
      sourceId: input.transactionId,
      movementDate: input.transactionDate,
      amount: input.amount,
      suggestedAllocations: suggestions,
      contextJson: {
        transactionType: input.type,
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });
    return { queued: true };
  }

  return { queued: false };
}
