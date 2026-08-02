import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import type {
  IncomeAllocateMode,
  MonthCloseMode,
  OverspendPolicy,
} from "./household-policies.schema";

export type HouseholdPolicies = {
  householdId: string;
  householdName: string;
  overspendPolicy: OverspendPolicy;
  monthCloseMode: MonthCloseMode;
  incomeAllocateMode: IncomeAllocateMode;
  canEdit: boolean;
  role: "partner" | "admin";
};

function asOverspend(value: string): OverspendPolicy {
  if (value === "block" || value === "allow_negative") return value;
  return "warn";
}

function asMonthClose(value: string): MonthCloseMode {
  if (value === "auto" || value === "manual") return value;
  return "assisted";
}

function asIncome(value: string): IncomeAllocateMode {
  if (value === "off" || value === "auto") return value;
  return "suggest";
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
