import { SupabaseClient } from "@supabase/supabase-js";
import {
  JarCurrentBalanceRow,
  JarMonthlyBalanceRow,
  JarPlanRow,
  JarReviewRow,
  JarRow,
} from "./types";
import { normalizeSuggestions, toMonthStart } from "./utils";

export async function fetchJarCommandCenter(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
) {
  const monthStart = toMonthStart(month);
  const [
    jarsResult,
    plansResult,
    currentResult,
    monthlyResult,
    reviewResult,
    categoryRulesResult,
  ] = await Promise.all([
    supabase
      .from("jars")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("jar_month_plans")
      .select("jar_id, month, fixed_amount, income_percent")
      .eq("household_id", householdId)
      .eq("month", monthStart),
    supabase
      .from("jar_current_balances")
      .select("*")
      .eq("household_id", householdId),
    supabase
      .from("jar_balances_monthly")
      .select("*")
      .eq("household_id", householdId)
      .eq("month", monthStart),
    supabase
      .from("jar_review_queue")
      .select("*")
      .eq("household_id", householdId)
      .eq("status", "pending")
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("jar_rules")
      .select("id")
      .eq("household_id", householdId)
      .eq("rule_type", "expense_category")
      .eq("is_active", true),
  ]);

  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (plansResult.error) throw new Error(plansResult.error.message);
  if (currentResult.error) throw new Error(currentResult.error.message);
  if (monthlyResult.error) throw new Error(monthlyResult.error.message);
  if (reviewResult.error) throw new Error(reviewResult.error.message);
  if (categoryRulesResult.error)
    throw new Error(categoryRulesResult.error.message);

  const jars = (jarsResult.data ?? []) as JarRow[];
  const planMap = new Map(
    ((plansResult.data ?? []) as JarPlanRow[]).map((row) => [row.jar_id, row]),
  );
  const currentMap = new Map(
    ((currentResult.data ?? []) as JarCurrentBalanceRow[]).map((row) => [
      row.jar_id,
      row,
    ]),
  );
  const monthlyMap = new Map(
    ((monthlyResult.data ?? []) as JarMonthlyBalanceRow[]).map((row) => [
      row.jar_id,
      row,
    ]),
  );

  const reviews = (
    (reviewResult.data ?? []) as Array<Record<string, unknown>>
  ).map(
    (row) =>
      ({
        id: String(row.id),
        source_type: String(row.source_type),
        source_id: String(row.source_id),
        movement_date: String(row.movement_date),
        month: String(row.month),
        amount: Math.round(Number(row.amount ?? 0)),
        status: String(row.status) as JarReviewRow["status"],
        suggested_allocations: normalizeSuggestions(row.suggested_allocations),
        context_json:
          row.context_json && typeof row.context_json === "object"
            ? (row.context_json as Record<string, unknown>)
            : {},
        resolved_allocations: normalizeSuggestions(row.resolved_allocations),
      }) satisfies JarReviewRow,
  );

  const items = jars.map((jar) => {
    const plan = planMap.get(jar.id);
    const current = currentMap.get(jar.id);
    const monthly = monthlyMap.get(jar.id);
    const monthlyTarget = Math.round(Number(plan?.fixed_amount ?? 0)) || 0;

    return {
      ...jar,
      monthlyTarget,
      monthlyIncomePercent: Number(plan?.income_percent ?? 0),
      currentBalance: Math.round(Number(current?.current_balance ?? 0)),
      monthInflow: Math.round(Number(monthly?.inflow_amount ?? 0)),
      monthOutflow: Math.round(Number(monthly?.outflow_amount ?? 0)),
      heldInCash: Math.round(Number(current?.held_in_cash ?? 0)),
      heldInSavings: Math.round(Number(current?.held_in_savings ?? 0)),
      heldInInvestments: Math.round(Number(current?.held_in_investments ?? 0)),
      heldInAssets: Math.round(Number(current?.held_in_assets ?? 0)),
    };
  });

  return {
    monthStart,
    items,
    reviews,
    summary: {
      totalBalance: items.reduce((sum, item) => sum + item.currentBalance, 0),
      totalMonthInflow: items.reduce((sum, item) => sum + item.monthInflow, 0),
      totalMonthOutflow: items.reduce((sum, item) => sum + item.monthOutflow, 0),
      totalHeldInSavings: items.reduce(
        (sum, item) => sum + item.heldInSavings,
        0,
      ),
      totalHeldInInvestments: items.reduce(
        (sum, item) => sum + item.heldInInvestments,
        0,
      ),
      totalHeldInAssets: items.reduce(
        (sum, item) => sum + item.heldInAssets,
        0,
      ),
      pendingReviews: reviews.length,
      mappedExpenseRules: (categoryRulesResult.data ?? []).length,
    },
  };
}

export async function getExpenseRuleJarId(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string | null,
) {
  if (!categoryId) return null;
  const result = await supabase
    .from("jar_rules")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("rule_type", "expense_category")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data?.jar_id ?? null;
}
