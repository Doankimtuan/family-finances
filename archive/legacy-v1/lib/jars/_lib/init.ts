import { SupabaseClient } from "@supabase/supabase-js";
import { JAR_PRESET_6 } from "./constants";
import { toMonthStart } from "./utils";

export async function ensureJarPreset(
  supabase: SupabaseClient,
  householdId: string,
  userId: string,
) {
  const insertRows = JAR_PRESET_6.map((jar) => ({
    household_id: householdId,
    name: jar.name,
    slug: jar.slug,
    color: jar.color,
    icon: jar.icon,
    jar_type: jar.jarType,
    monthly_strategy: jar.monthlyStrategy,
    spend_policy: jar.spendPolicy,
    sort_order: jar.sortOrder,
    created_by: userId,
  }));

  const jarsUpsert = await supabase
    .from("jars")
    .upsert(insertRows, {
      onConflict: "household_id,slug",
      ignoreDuplicates: true,
    });
  if (jarsUpsert.error) throw new Error(jarsUpsert.error.message);

  const month = toMonthStart(new Date());
  const jarsResult = await supabase
    .from("jars")
    .select("id, slug")
    .eq("household_id", householdId)
    .in(
      "slug",
      JAR_PRESET_6.map((jar) => jar.slug),
    );
  if (jarsResult.error) throw new Error(jarsResult.error.message);

  const jarIdBySlug = new Map(
    (jarsResult.data ?? []).map((row) => [row.slug, row.id]),
  );
  const planRows = JAR_PRESET_6.map((jar) => ({
    household_id: householdId,
    jar_id: jarIdBySlug.get(jar.slug),
    month,
    fixed_amount: 0,
    income_percent: jar.incomePercent,
    created_by: userId,
  })).filter((row) => row.jar_id);

  if (planRows.length > 0) {
    const plansUpsert = await supabase
      .from("jar_month_plans")
      .upsert(planRows, { onConflict: "jar_id,month" });
    if (plansUpsert.error) throw new Error(plansUpsert.error.message);
  }
}
