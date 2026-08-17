import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type HouseholdMemberRow = {
  id: string;
  userId: string;
  role: "partner" | "admin";
  email: string | null;
  displayName: string | null;
  isSelf: boolean;
};

export type HouseholdSummary = {
  id: string;
  name: string;
};

/**
 * List active members for the caller's household (AC-012 / AC-020).
 */
export async function listHouseholdMembers(): Promise<{
  household: HouseholdSummary | null;
  members: HouseholdMemberRow[];
}> {
  if (!getSupabaseEnv().isConfigured) {
    return { household: null, members: [] };
  }

  const user = await getSessionUser();
  if (!user) {
    return { household: null, members: [] };
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return { household: null, members: [] };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: household, error: householdError },
      { data: rows, error: rowsError },
    ] = await Promise.all([
      supabase
        .from("households")
        .select("id, name")
        .eq("id", membership.householdId)
        .maybeSingle(),
      supabase
        .from("household_members")
        .select("id, user_id, role, email, display_name")
        .eq("household_id", membership.householdId)
        .eq("is_active", true)
        .order("joined_at", { ascending: true }),
    ]);

    if (householdError || rowsError) {
      logTenancyFailure(
        TENANCY_OPERATION.HOUSEHOLD_QUERY,
        householdError ?? rowsError,
        { householdId: membership.householdId },
      );
      return { household: null, members: [] };
    }

    if (!household) {
      return { household: null, members: [] };
    }

    const members: HouseholdMemberRow[] = (rows ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role === "partner" ? "partner" : "admin",
      email: row.email ?? null,
      displayName: row.display_name ?? null,
      isSelf: row.user_id === user.id,
    }));

    return {
      household: { id: household.id, name: household.name },
      members,
    };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
      householdId: membership.householdId,
    });
    return { household: null, members: [] };
  }
}
