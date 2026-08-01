import { SupabaseClient } from "@supabase/supabase-js";

export async function resolveCategoryJarId(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string | null,
): Promise<string | null> {
  if (!categoryId) return null;

  const result = await supabase
    .from("jar_category_rules")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data?.jar_id ?? null;
}

export async function resolveCategoryJarIdWithFallback(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string | null,
): Promise<string | null> {
  if (!categoryId) return null;

  const jarId = await resolveCategoryJarId(supabase, householdId, categoryId);
  if (jarId) return jarId;

  const legacyResult = await supabase
    .from("jar_rules")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("rule_type", "expense_category")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (legacyResult.error) throw new Error(legacyResult.error.message);
  return legacyResult.data?.jar_id ?? null;
}

export async function fetchActiveCategoryRules(
  supabase: SupabaseClient,
  householdId: string,
) {
  const result = await supabase
    .from("jar_category_rules")
    .select("id, category_id, jar_id, confidence, assignment_type")
    .eq("household_id", householdId)
    .eq("is_active", true);

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as Array<{
    id: string;
    category_id: string;
    jar_id: string;
    confidence: string;
    assignment_type: string;
  }>;
}

export async function upsertCategoryRule(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    categoryId: string;
    jarId: string;
    createdBy?: string | null;
  },
) {
  const result = await supabase
    .from("jar_category_rules")
    .upsert(
      {
        household_id: input.householdId,
        category_id: input.categoryId,
        jar_id: input.jarId,
        assignment_type: "manual",
        confidence: "high",
        is_active: true,
        created_by: input.createdBy ?? null,
      },
      { onConflict: "household_id,category_id" },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to upsert category rule.");
  }

  return result.data.id;
}

export async function bulkUpsertCategoryRules(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    rules: Array<{ categoryId: string; jarId: string }>;
    createdBy?: string | null;
  },
) {
  const rows = input.rules.map((rule) => ({
    household_id: input.householdId,
    category_id: rule.categoryId,
    jar_id: rule.jarId,
    assignment_type: "manual",
    confidence: "high",
    is_active: true,
    created_by: input.createdBy ?? null,
  }));

  const result = await supabase
    .from("jar_category_rules")
    .upsert(rows, { onConflict: "household_id,category_id" })
    .select("id");

  if (result.error) {
    throw new Error(result.error?.message ?? "Failed to bulk upsert category rules.");
  }

  return (result.data ?? []).map((row: { id: string }) => row.id);
}
