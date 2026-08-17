import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { inviteTokenSchema } from "./invitation.schema";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  type InvitationErrorCode,
} from "./tenancy-constants";
import { classifyInvitationRpcError, logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type AcceptInvitationErrorCode = Exclude<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.ALREADY_PENDING
  | typeof INVITATION_ERROR_CODE.NO_HOUSEHOLD
>;

export type AcceptInvitationResult = Result<
  { householdId: string },
  AcceptInvitationErrorCode
>;

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
      const mapped = classifyInvitationRpcError(error);
      const code =
        mapped === INVITATION_ERROR_CODE.ALREADY_PENDING ||
        mapped === INVITATION_ERROR_CODE.NO_HOUSEHOLD
          ? INVITATION_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === INVITATION_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.INVITATION_ACCEPT, error);
      }
      return { ok: false, code };
    }

    if (typeof data !== "string" || data.length === 0) {
      logTenancyFailure(
        TENANCY_OPERATION.INVITATION_ACCEPT,
        new Error("accept invitation returned an invalid household id"),
      );
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, householdId: data };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.INVITATION_ACCEPT, error);
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
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

export type DeclineInvitationResult = Result<
  object,
  DeclineInvitationErrorCode
>;

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
      const mapped = classifyInvitationRpcError(error);
      const code =
        mapped === INVITATION_ERROR_CODE.EXPIRED ||
        mapped === INVITATION_ERROR_CODE.ALREADY_MEMBER ||
        mapped === INVITATION_ERROR_CODE.HOUSEHOLD_FULL ||
        mapped === INVITATION_ERROR_CODE.ALREADY_PENDING ||
        mapped === INVITATION_ERROR_CODE.NO_HOUSEHOLD
          ? INVITATION_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === INVITATION_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.INVITATION_DECLINE, error);
      }
      return { ok: false, code };
    }

    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.INVITATION_DECLINE, error);
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
