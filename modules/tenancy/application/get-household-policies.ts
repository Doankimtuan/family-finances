import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  IncomeAllocateMode as IncomeAllocateModeConst,
  RitualMode,
} from "@/modules/plan/application/plan-constants";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  OverspendPolicy,
  type IncomeAllocateMode,
  type MonthCloseMode,
  type OverspendPolicy as OverspendPolicyValue,
} from "./household-policies.schema";

export type HouseholdPolicies = {
  householdId: string;
  householdName: string;
  overspendPolicy: OverspendPolicyValue;
  monthCloseMode: MonthCloseMode;
  incomeAllocateMode: IncomeAllocateMode;
  canEdit: boolean;
  role: "partner" | "admin";
};

function asOverspend(value: string): OverspendPolicyValue {
  if (
    value === OverspendPolicy.BLOCK ||
    value === OverspendPolicy.ALLOW_NEGATIVE
  ) {
    return value;
  }
  return OverspendPolicy.WARN;
}

function asMonthClose(value: string): MonthCloseMode {
  if (value === RitualMode.AUTO || value === RitualMode.MANUAL) return value;
  return RitualMode.ASSISTED;
}

function asIncome(value: string): IncomeAllocateMode {
  if (
    value === IncomeAllocateModeConst.OFF ||
    value === IncomeAllocateModeConst.AUTO
  ) {
    return value;
  }
  return IncomeAllocateModeConst.SUGGEST;
}

/**
 * Load household policy settings for Together policies screen.
 */
export async function getHouseholdPolicies(): Promise<HouseholdPolicies | null> {
  if (!getSupabaseEnv().isConfigured) {
    return null;
  }

  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("households")
      .select(
        "id, name, overspend_policy, month_close_mode, income_allocate_mode",
      )
      .eq("id", membership.householdId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      householdId: data.id,
      householdName: data.name,
      overspendPolicy: asOverspend(data.overspend_policy),
      monthCloseMode: asMonthClose(data.month_close_mode),
      incomeAllocateMode: asIncome(data.income_allocate_mode),
      canEdit: membership.role === "admin",
      role: membership.role,
    };
  } catch {
    return null;
  }
}
