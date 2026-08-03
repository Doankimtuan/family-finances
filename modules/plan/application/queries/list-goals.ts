import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { GoalStatus } from "../plan-constants";
import {
  mapGoalRow,
  type GoalDetail,
  type GoalsList,
} from "../goal-recurring-types";

export async function listGoals(): Promise<GoalsList | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: rows, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("id, name, target_amount, funded_amount, target_date, status")
        .eq("household_id", gate.householdId)
        .neq("status", GoalStatus.CANCELLED)
        .order("created_at", { ascending: false }),
    ]);

    if (error) return null;

    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      goals: (rows ?? []).map(mapGoalRow),
    };
  } catch {
    return null;
  }
}

export async function getGoal(goalId: string): Promise<GoalDetail | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: row, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("id, name, target_amount, funded_amount, target_date, status")
        .eq("household_id", gate.householdId)
        .eq("id", goalId)
        .maybeSingle(),
    ]);

    if (error || !row) return null;

    return {
      ...mapGoalRow(row),
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
    };
  } catch {
    return null;
  }
}
