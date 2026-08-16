import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { currentPeriodMonth } from "../ritual-period";
import { listJars } from "../queries/list-jars";
import { JarPlanKind } from "../jar-types";

/**
 * Lazy month-start jar rule snapshots for historical Monthly Review stability.
 * Idempotent: skips jars already snapshotted for the period.
 */
export async function ensureJarPeriodRuleSnapshots(
  periodMonth = currentPeriodMonth(),
): Promise<{ ok: true; written: number } | { ok: false }> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false };

  try {
    const listed = await listJars();
    if (!listed) return { ok: false };
    const jars = [...listed.active, ...listed.paused, ...listed.archived];
    if (jars.length === 0) return { ok: true, written: 0 };

    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("jar_period_rule_snapshots")
      .select("jar_id")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth);
    const existingIds = new Set((existing ?? []).map((row) => row.jar_id as string));

    const rows = jars
      .filter((jar) => !existingIds.has(jar.id) && jar.plan)
      .map((jar) => ({
        household_id: gate.householdId,
        jar_id: jar.id,
        period_month: periodMonth,
        jar_name: jar.name,
        plan_kind: jar.plan?.kind ?? JarPlanKind.FIXED,
        percent_bps: jar.plan?.percentBps ?? 0,
        fixed_amount: jar.plan?.fixedAmount ?? 0,
        rollover_mode: jar.rolloverMode,
      }));

    if (rows.length === 0) return { ok: true, written: 0 };

    const { error } = await supabase
      .from("jar_period_rule_snapshots")
      .insert(rows);
    if (error) return { ok: false };
    return { ok: true, written: rows.length };
  } catch {
    return { ok: false };
  }
}
