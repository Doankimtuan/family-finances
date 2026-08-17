import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type PolicyEventRow = {
  id: string;
  createdAt: string;
  eventType: string;
};

/**
 * Recent partner-visible policy audit events (AC-013).
 */
export async function listPolicyEvents(limit = 5): Promise<PolicyEventRow[]> {
  if (!getSupabaseEnv().isConfigured) {
    return [];
  }

  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("household_policy_events")
      .select("id, event_type, created_at")
      .eq("household_id", membership.householdId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
        householdId: membership.householdId,
      });
      return [];
    }
    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      eventType: row.event_type,
    }));
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
      householdId: membership.householdId,
    });
    return [];
  }
}
