import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { mapIncomeAllocateMode } from "../jar-types";
import {
  mapRecurringRow,
  type RecurringDetail,
  type RecurringList,
} from "../goal-recurring-types";

export async function listRecurring(): Promise<RecurringList | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: rows, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency, income_allocate_mode")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("recurring_rules")
        .select(
          "id, name, direction, amount, frequency, interval_count, day_of_month, day_of_week, start_date, next_run_date, is_active",
        )
        .eq("household_id", gate.householdId)
        .order("created_at", { ascending: false }),
    ]);

    if (error) return null;

    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      incomeAllocateMode: mapIncomeAllocateMode(
        household?.income_allocate_mode,
      ),
      rules: (rows ?? []).map(mapRecurringRow),
    };
  } catch {
    return null;
  }
}

export async function getRecurring(
  ruleId: string,
): Promise<RecurringDetail | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: row, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency, income_allocate_mode")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("recurring_rules")
        .select(
          "id, name, direction, amount, frequency, interval_count, day_of_month, day_of_week, start_date, next_run_date, is_active",
        )
        .eq("household_id", gate.householdId)
        .eq("id", ruleId)
        .maybeSingle(),
    ]);

    if (error || !row) return null;

    return {
      ...mapRecurringRow(row),
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
