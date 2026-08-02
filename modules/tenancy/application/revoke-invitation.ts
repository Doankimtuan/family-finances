import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { z } from "zod";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  INVITATION_RPC_MESSAGE_NEEDLE,
  type InvitationErrorCode,
} from "./tenancy-constants";

const idSchema = z.string().uuid();

export type RevokeInvitationErrorCode = Extract<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.UNCONFIGURED
  | typeof INVITATION_ERROR_CODE.UNAUTHENTICATED
  | typeof INVITATION_ERROR_CODE.INVALID
  | typeof INVITATION_ERROR_CODE.NOT_FOUND
  | typeof INVITATION_ERROR_CODE.UNKNOWN
>;

export type RevokeInvitationResult =
  { ok: true } | { ok: false; code: RevokeInvitationErrorCode };

/**
 * Revoke a pending invitation for the caller's household.
 */
export async function revokeInvitation(
  invitationId: string,
): Promise<RevokeInvitationResult> {
  const parsed = idSchema.safeParse(invitationId);
  if (!parsed.success) {
    return { ok: false, code: INVITATION_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: INVITATION_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: INVITATION_ERROR_CODE.UNAUTHENTICATED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("revoke_household_invitation", {
      p_invitation_id: parsed.data,
    });

    if (error) {
      const message = (error.message ?? "").toLowerCase();
      if (message.includes(INVITATION_RPC_MESSAGE_NEEDLE.NOT_FOUND)) {
        return { ok: false, code: INVITATION_ERROR_CODE.NOT_FOUND };
      }
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true };
  } catch {
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
