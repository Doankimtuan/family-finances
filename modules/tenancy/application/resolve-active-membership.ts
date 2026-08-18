import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

/**
 * Active household membership for money actions (AC-002 / REQ-002 / BR-02a / BR-12).
 */
export type ActiveMembership = {
  membershipId: string;
  householdId: string;
  userId: string;
  role: "partner" | "admin";
};

export async function resolveActiveMembership(
  userId: string,
  client?: SupabaseClient,
): Promise<ActiveMembership | null> {
  if (!userId || !getSupabaseEnv().isConfigured) {
    return null;
  }

  try {
    const supabase = client ?? (await createSupabaseServerClient());
    const { data, error } = await supabase
      .from("household_members")
      .select("id, household_id, role, user_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_RESOLVE, error, {
        userId,
      });
      return null;
    }
    if (!data) {
      return null;
    }

    const role = data.role === "partner" ? "partner" : "admin";
    return {
      membershipId: data.id,
      householdId: data.household_id,
      userId: data.user_id,
      role,
    };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_RESOLVE, error, { userId });
    return null;
  }
}
