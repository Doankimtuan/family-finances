import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  mapIncomeAllocateMode,
  mapJarRow,
  JarState,
  type JarDetail,
  type JarList,
  type PlanJar,
} from "../jar-types";

const JAR_SELECT =
  "id, name, kind, sort_order, is_archived, is_paused, jar_plans(plan_kind, percent_bps, fixed_amount)";

async function fetchHouseholdJars(householdId: string): Promise<{
  currency: string;
  incomeAllocateMode: JarList["incomeAllocateMode"];
  jars: PlanJar[];
} | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: household }, { data: rows, error }] = await Promise.all([
    supabase
      .from("households")
      .select("base_currency, income_allocate_mode")
      .eq("id", householdId)
      .maybeSingle(),
    supabase
      .from("jars")
      .select(JAR_SELECT)
      .eq("household_id", householdId)
      .order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return null;
  }

  return {
    currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
    incomeAllocateMode: mapIncomeAllocateMode(household?.income_allocate_mode),
    jars: (rows ?? []).map(mapJarRow),
  };
}

/**
 * Full jar list — Active targets first; Paused/Archived are non-targets (AC-003).
 */
export async function listJars(): Promise<JarList | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const packed = await fetchHouseholdJars(gate.householdId);
    if (!packed) return null;

    return {
      householdId: gate.householdId,
      currency: packed.currency,
      incomeAllocateMode: packed.incomeAllocateMode,
      active: packed.jars.filter((j) => j.state === JarState.ACTIVE),
      paused: packed.jars.filter((j) => j.state === JarState.PAUSED),
      archived: packed.jars.filter((j) => j.state === JarState.ARCHIVED),
    };
  } catch {
    return null;
  }
}

export async function getJar(jarId: string): Promise<JarDetail | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: row, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency, income_allocate_mode")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("jars")
        .select(JAR_SELECT)
        .eq("household_id", gate.householdId)
        .eq("id", jarId)
        .maybeSingle(),
    ]);

    if (error || !row) {
      return null;
    }

    const jar = mapJarRow(row);
    return {
      ...jar,
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      incomeAllocateMode: mapIncomeAllocateMode(
        household?.income_allocate_mode,
      ),
    };
  } catch {
    return null;
  }
}
