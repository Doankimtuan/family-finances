import type { SupabaseClient } from "@supabase/supabase-js";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export async function listActiveMembershipIds(
  client: SupabaseClient,
  householdId: string,
  membershipIds: readonly string[],
): Promise<ReadonlySet<string> | null> {
  if (membershipIds.length === 0) return new Set();

  try {
    const { data, error } = await client
      .from("household_members")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .in("id", membershipIds);

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
        householdId,
      });
      return null;
    }

    return new Set((data ?? []).map((row) => row.id));
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
      householdId,
    });
    return null;
  }
}
