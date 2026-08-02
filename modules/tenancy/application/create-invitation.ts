import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { inviteEmailSchema, type InviteEmailInput } from "./invitation.schema";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  INVITATION_RPC_MESSAGE_NEEDLE,
  type InvitationErrorCode,
} from "./tenancy-constants";

export type CreateInvitationErrorCode = Exclude<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.NOT_FOUND
  | typeof INVITATION_ERROR_CODE.NOT_PENDING
  | typeof INVITATION_ERROR_CODE.EXPIRED
  | typeof INVITATION_ERROR_CODE.EMAIL_MISMATCH
>;

export type CreateInvitationResult =
  | {
      ok: true;
      invitationId: string;
      token: string;
      expiresAt: string;
    }
  | {
      ok: false;
      code: CreateInvitationErrorCode;
    };

function mapCreateError(message: string): CreateInvitationErrorCode {
  const m = message.toLowerCase();
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.INVALID_EMAIL)) {
    return INVITATION_ERROR_CODE.INVALID;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_MEMBER)) {
    return INVITATION_ERROR_CODE.ALREADY_MEMBER;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_PENDING)) {
    return INVITATION_ERROR_CODE.ALREADY_PENDING;
  }
  if (
    m.includes(INVITATION_RPC_MESSAGE_NEEDLE.TWO_PARTNERS) ||
    m.includes(INVITATION_RPC_MESSAGE_NEEDLE.HOUSEHOLD_FULL)
  ) {
    return INVITATION_ERROR_CODE.HOUSEHOLD_FULL;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NO_ACTIVE_HOUSEHOLD)) {
    return INVITATION_ERROR_CODE.NO_HOUSEHOLD;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION)) {
    return INVITATION_ERROR_CODE.UNAUTHENTICATED;
  }
  return INVITATION_ERROR_CODE.UNKNOWN;
}

/**
 * Create a pending partner invite (token deep link; email delivery out of band).
 */
export async function createInvitation(
  raw: InviteEmailInput,
): Promise<CreateInvitationResult> {
  const parsed = inviteEmailSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("create_household_invitation", {
      p_email: parsed.data.email,
    });

    if (error) {
      return { ok: false, code: mapCreateError(error.message ?? "") };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (
      !row ||
      typeof row.invitation_id !== "string" ||
      typeof row.token !== "string"
    ) {
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      invitationId: row.invitation_id,
      token: row.token,
      expiresAt: String(row.expires_at),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { ok: false, code: mapCreateError(message) };
  }
}
