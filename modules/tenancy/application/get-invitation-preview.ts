import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { inviteTokenSchema } from "./invitation.schema";
import {
  INVITATION_ERROR_CODE,
  INVITATION_STATUS,
  type InvitationErrorCode,
} from "./tenancy-constants";

export type InvitationPreview = {
  householdName: string;
  inviteEmail: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
};

export type GetInvitationPreviewErrorCode = Extract<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.UNCONFIGURED
  | typeof INVITATION_ERROR_CODE.INVALID
  | typeof INVITATION_ERROR_CODE.NOT_FOUND
  | typeof INVITATION_ERROR_CODE.UNKNOWN
>;

export type GetInvitationPreviewResult =
  | { ok: true; preview: InvitationPreview }
  | { ok: false; code: GetInvitationPreviewErrorCode };

/**
 * Preview invite by token (authenticated or anon via security-definer RPC).
 */
export async function getInvitationPreview(
  token: string,
): Promise<GetInvitationPreviewResult> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return { ok: false, code: INVITATION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: INVITATION_ERROR_CODE.UNCONFIGURED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_invitation_preview", {
      p_token: parsed.data,
    });

    if (error) {
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.household_name !== "string") {
      return { ok: false, code: INVITATION_ERROR_CODE.NOT_FOUND };
    }

    return {
      ok: true,
      preview: {
        householdName: row.household_name,
        inviteEmail: String(row.invite_email ?? ""),
        status: String(row.status ?? INVITATION_STATUS.PENDING),
        expiresAt: String(row.expires_at ?? ""),
        isExpired: Boolean(row.is_expired),
      },
    };
  } catch {
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
