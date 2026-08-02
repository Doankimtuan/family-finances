import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import { INVITATION_STATUS } from "./tenancy-constants";

export type PendingInvitation = {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

/**
 * Pending (non-expired) invitations for the caller's active household.
 */
export async function listPendingInvitations(): Promise<PendingInvitation[]> {
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
      .from("household_invitations")
      .select("id, email, token, expires_at, created_at")
      .eq("household_id", membership.householdId)
      .eq("status", INVITATION_STATUS.PENDING)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      email: row.email,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
