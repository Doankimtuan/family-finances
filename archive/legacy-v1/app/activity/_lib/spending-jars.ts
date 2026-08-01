import { isServerFeatureEnabled } from "@/lib/config/features";
import type { SpendingJarAlertLevel, SpendingJarSummaryRow } from "@/lib/jars/spending";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type SpendingJarWarning = {
  jarId: string;
  jarName: string;
  alertLevel: SpendingJarAlertLevel;
  usagePercent: number | null;
  spent: number;
  limit: number;
};

export async function ensureFallbackSpendingJarId(
  supabase: SupabaseClient,
  householdId: string,
  userId: string,
): Promise<string | null> {
  const existing = await supabase
    .from("jar_definitions")
    .select("id")
    .eq("household_id", householdId)
    .eq("slug", "unassigned")
    .eq("is_archived", false)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  await supabase.from("jar_definitions").upsert(
    {
      household_id: householdId,
      name: "Unassigned",
      slug: "unassigned",
      color: "#64748B",
      icon: "archive",
      sort_order: 999,
      is_system_default: true,
      is_archived: false,
      created_by: userId,
    },
    { onConflict: "household_id,slug", ignoreDuplicates: true },
  );

  const afterUpsert = await supabase
    .from("jar_definitions")
    .select("id")
    .eq("household_id", householdId)
    .eq("slug", "unassigned")
    .eq("is_archived", false)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  return afterUpsert.data?.id ?? null;
}

export async function ensureSpendingJarCategoryMapping(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string,
  userId: string,
) {
  const existing = await supabase
    .from("spending_jar_category_map")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .limit(1)
    .maybeSingle();

  if (existing.data?.jar_id) return existing.data.jar_id;

  const fallbackJarId = await ensureFallbackSpendingJarId(
    supabase,
    householdId,
    userId,
  );
  if (!fallbackJarId) return null;

  await supabase.from("spending_jar_category_map").upsert(
    {
      household_id: householdId,
      category_id: categoryId,
      jar_id: fallbackJarId,
      created_by: userId,
    },
    { onConflict: "household_id,category_id", ignoreDuplicates: true },
  );

  return fallbackJarId;
}

export async function getSpendingJarWarningForCategory(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string | null,
  userId: string,
): Promise<SpendingJarWarning | null> {
  if (!isServerFeatureEnabled("jars") || !categoryId) return null;

  await ensureSpendingJarCategoryMapping(supabase, householdId, categoryId, userId);

  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;
  const summaryResult = await supabase.rpc("rpc_spending_jar_monthly_summary", {
    p_household_id: householdId,
    p_month: monthStart,
  });

  if (summaryResult.error) return null;

  const rows = (summaryResult.data ?? []) as SpendingJarSummaryRow[];
  const mapRow = await supabase
    .from("spending_jar_category_map")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .limit(1)
    .maybeSingle();

  const jarId = mapRow.data?.jar_id;
  if (!jarId) return null;

  const jarSummary = rows.find((row) => row.jar_id === jarId);
  if (!jarSummary) return null;
  if (
    jarSummary.alert_level !== "warning" &&
    jarSummary.alert_level !== "exceeded"
  ) {
    return null;
  }

  return {
    jarId: jarSummary.jar_id,
    jarName: jarSummary.jar_name,
    alertLevel: jarSummary.alert_level,
    usagePercent:
      jarSummary.usage_percent === null || jarSummary.usage_percent === undefined
        ? null
        : Number(jarSummary.usage_percent),
    spent: Number(jarSummary.monthly_spent ?? 0),
    limit: Number(jarSummary.monthly_limit ?? 0),
  };
}
