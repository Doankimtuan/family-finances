import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { mapJarRow, type PlanJar, type PlanPulse } from "../jar-types";

/**
 * Plan hub read model — Active jars only in preview (AC-003 / BR-03).
 * Never presents jar envelopes as bank/ledger balance (BR-01).
 */
export async function getPlanPulse(): Promise<PlanPulse | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: rows, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency, month_close_mode, income_allocate_mode")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("jars")
        .select("id, name, kind, sort_order, is_archived")
        .eq("household_id", gate.householdId)
        .order("sort_order", { ascending: true }),
    ]);

    if (error) {
      return null;
    }

    const jars = (rows ?? []).map(mapJarRow);
    const activeJars = jars.filter((jar) => jar.state === "active");
    const archivedJarCount = jars.length - activeJars.length;

    const monthCloseMode = household?.month_close_mode;
    const incomeAllocateMode = household?.income_allocate_mode;

    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? "VND").toUpperCase(),
      monthCloseMode:
        monthCloseMode === "auto" || monthCloseMode === "manual"
          ? monthCloseMode
          : "assisted",
      incomeAllocateMode:
        incomeAllocateMode === "off" || incomeAllocateMode === "auto"
          ? incomeAllocateMode
          : "suggest",
      activeJars,
      archivedJarCount,
    };
  } catch {
    return null;
  }
}

export async function listActiveJars(): Promise<PlanJar[] | null> {
  const pulse = await getPlanPulse();
  return pulse?.activeJars ?? null;
}
