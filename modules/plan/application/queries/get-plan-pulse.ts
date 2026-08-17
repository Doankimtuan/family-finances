const PLAN_PULSE_LOG_CONTEXT = "[plan.plan-pulse]";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  mapIncomeAllocateMode,
  mapJarRow,
  mapMonthCloseMode,
  JarState,
  type PlanJar,
  type PlanPulse,
} from "../jar-types";

const JAR_SELECT =
  "id, name, kind, sort_order, is_archived, is_paused, rollover_mode, jar_plans(plan_kind, percent_bps, fixed_amount)";

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
        .select(JAR_SELECT)
        .eq("household_id", gate.householdId)
        .order("sort_order", { ascending: true }),
    ]);

    if (error) throw error;

    const jars = (rows ?? []).map(mapJarRow);
    const activeJars = jars.filter((jar) => jar.state === JarState.ACTIVE);
    const pausedJarCount = jars.filter(
      (jar) => jar.state === JarState.PAUSED,
    ).length;
    const archivedJarCount = jars.filter(
      (jar) => jar.state === JarState.ARCHIVED,
    ).length;

    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      monthCloseMode: mapMonthCloseMode(household?.month_close_mode),
      incomeAllocateMode: mapIncomeAllocateMode(
        household?.income_allocate_mode,
      ),
      activeJars,
      pausedJarCount,
      archivedJarCount,
    };
  } catch (error) {
    console.error(PLAN_PULSE_LOG_CONTEXT, error);
    return null;
  }
}

export async function listActiveJars(): Promise<PlanJar[] | null> {
  const pulse = await getPlanPulse();
  return pulse?.activeJars ?? null;
}
