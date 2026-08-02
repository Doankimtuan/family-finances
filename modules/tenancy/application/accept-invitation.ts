import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { inviteTokenSchema } from "./invitation.schema";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  INVITATION_RPC_MESSAGE_NEEDLE,
  type InvitationErrorCode,
} from "./tenancy-constants";

export type AcceptInvitationErrorCode = Exclude<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.ALREADY_PENDING
  | typeof INVITATION_ERROR_CODE.NO_HOUSEHOLD
>;

export type AcceptInvitationResult =
  | { ok: true; householdId: string }
  | {
      ok: false;
      code: AcceptInvitationErrorCode;
    };

function mapAcceptError(message: string): AcceptInvitationErrorCode {
  const m = message.toLowerCase();
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NOT_FOUND)) {
    return INVITATION_ERROR_CODE.NOT_FOUND;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NOT_PENDING)) {
    return INVITATION_ERROR_CODE.NOT_PENDING;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.EXPIRED)) {
    return INVITATION_ERROR_CODE.EXPIRED;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.EMAIL_MISMATCH)) {
    return INVITATION_ERROR_CODE.EMAIL_MISMATCH;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.ALREADY_BELONGS)) {
    return INVITATION_ERROR_CODE.ALREADY_MEMBER;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.TWO_PARTNERS)) {
    return INVITATION_ERROR_CODE.HOUSEHOLD_FULL;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION)) {
    return INVITATION_ERROR_CODE.UNAUTHENTICATED;
  }
  return INVITATION_ERROR_CODE.UNKNOWN;
}

/**
 * Accept invite token → partner membership (BR-12 one household).
 */
export async function acceptInvitation(
  token: string,
): Promise<AcceptInvitationResult> {
  const parsed = inviteTokenSchema.safeParse(token);
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
    const { data, error } = await supabase.rpc("accept_household_invitation", {
      p_token: parsed.data,
    });

    if (error) {
      return { ok: false, code: mapAcceptError(error.message ?? "") };
    }

    if (typeof data !== "string" || data.length === 0) {
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, householdId: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { ok: false, code: mapAcceptError(message) };
  }
}

export type DeclineInvitationErrorCode = Exclude<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.EXPIRED
  | typeof INVITATION_ERROR_CODE.ALREADY_MEMBER
  | typeof INVITATION_ERROR_CODE.HOUSEHOLD_FULL
  | typeof INVITATION_ERROR_CODE.ALREADY_PENDING
  | typeof INVITATION_ERROR_CODE.NO_HOUSEHOLD
>;

export type DeclineInvitationResult =
  | { ok: true }
  | {
      ok: false;
      code: DeclineInvitationErrorCode;
    };

function mapDeclineError(message: string): DeclineInvitationErrorCode {
  const m = message.toLowerCase();
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NOT_FOUND)) {
    return INVITATION_ERROR_CODE.NOT_FOUND;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NOT_PENDING)) {
    return INVITATION_ERROR_CODE.NOT_PENDING;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.EMAIL_MISMATCH)) {
    return INVITATION_ERROR_CODE.EMAIL_MISMATCH;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION)) {
    return INVITATION_ERROR_CODE.UNAUTHENTICATED;
  }
  return INVITATION_ERROR_CODE.UNKNOWN;
}

/**
 * Decline invite token for matching authenticated email.
 */
export async function declineInvitation(
  token: string,
): Promise<DeclineInvitationResult> {
  const parsed = inviteTokenSchema.safeParse(token);
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
    const { error } = await supabase.rpc("decline_household_invitation", {
      p_token: parsed.data,
    });

    if (error) {
      return { ok: false, code: mapDeclineError(error.message ?? "") };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { ok: false, code: mapDeclineError(message) };
  }
}
