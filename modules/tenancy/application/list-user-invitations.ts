import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { getInvitationPreview } from "./get-invitation-preview";
import {
  INVITATION_ERROR_CODE,
  INVITATION_STATUS,
  TENANCY_OPERATION,
} from "./tenancy-constants";
import { logTenancyFailure } from "./tenancy-error";

export type UserInvitation = {
  id: string;
  householdName: string;
};

export type ListUserInvitationsResult =
  | { ok: true; invitations: UserInvitation[] }
  | {
      ok: false;
      code:
        | typeof INVITATION_ERROR_CODE.UNCONFIGURED
        | typeof INVITATION_ERROR_CODE.UNAUTHENTICATED
        | typeof INVITATION_ERROR_CODE.UNKNOWN;
    };

/** Pending invitations addressed to the authenticated user's email. */
export async function listUserInvitations(): Promise<ListUserInvitationsResult> {
  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: INVITATION_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: INVITATION_ERROR_CODE.UNAUTHENTICATED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("household_invitations")
      .select("id, email, token, status, expires_at")
      .eq("status", INVITATION_STATUS.PENDING)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.INVITATION_QUERY, error);
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    const invitations: UserInvitation[] = [];
    for (const row of data ?? []) {
      if (row.email.toLowerCase() !== user.email?.toLowerCase()) continue;
      const preview = await getInvitationPreview(row.token);
      if (!preview.ok) {
        if (preview.code === INVITATION_ERROR_CODE.NOT_FOUND) continue;
        return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
      }
      if (
        preview.preview.inviteEmail.toLowerCase() !==
          user.email?.toLowerCase() ||
        preview.preview.status !== INVITATION_STATUS.PENDING ||
        preview.preview.isExpired
      ) {
        continue;
      }
      invitations.push({
        id: row.id,
        householdName: preview.preview.householdName,
      });
    }

    return { ok: true, invitations };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.INVITATION_QUERY, error);
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
