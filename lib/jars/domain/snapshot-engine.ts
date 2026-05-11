import { SupabaseClient } from "@supabase/supabase-js";
import { toMonthStart } from "../_lib/utils";
import { JarMonthlySnapshotRow } from "../_lib/types";

export async function fetchSnapshotsForMonth(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
): Promise<JarMonthlySnapshotRow[]> {
  const monthStart = toMonthStart(month);

  const result = await supabase
    .from("jar_monthly_snapshots")
    .select("*")
    .eq("household_id", householdId)
    .eq("month", monthStart);

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as JarMonthlySnapshotRow[];
}

export async function fetchSnapshotForJarMonth(
  supabase: SupabaseClient,
  householdId: string,
  jarId: string,
  month: string,
): Promise<JarMonthlySnapshotRow | null> {
  const monthStart = toMonthStart(month);

  const result = await supabase
    .from("jar_monthly_snapshots")
    .select("*")
    .eq("household_id", householdId)
    .eq("jar_id", jarId)
    .eq("month", monthStart)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return (result.data as JarMonthlySnapshotRow) ?? null;
}

export async function isMonthClosed(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
): Promise<boolean> {
  const monthStart = toMonthStart(month);

  const result = await supabase
    .from("jar_month_close_runs")
    .select("id")
    .eq("household_id", householdId)
    .eq("month", monthStart)
    .eq("status", "approved")
    .maybeSingle();

  return Boolean(result.data);
}

export async function getMonthCloseRun(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
) {
  const monthStart = toMonthStart(month);

  const result = await supabase
    .from("jar_month_close_runs")
    .select("*")
    .eq("household_id", householdId)
    .eq("month", monthStart)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as Record<string, unknown> | null;
}
