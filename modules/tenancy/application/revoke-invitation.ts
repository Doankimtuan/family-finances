import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { z } from "zod";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  type InvitationErrorCode,
} from "./tenancy-constants";
import { classifyInvitationRpcError, logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

const idSchema = z.string().uuid();

export type RevokeInvitationErrorCode = Extract<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.UNCONFIGURED
  | typeof INVITATION_ERROR_CODE.UNAUTHENTICATED
  | typeof INVITATION_ERROR_CODE.INVALID
  | typeof INVITATION_ERROR_CODE.NOT_FOUND
  | typeof INVITATION_ERROR_CODE.UNKNOWN
>;

export type RevokeInvitationResult = Result<object, RevokeInvitationErrorCode>;

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
      const mapped = classifyInvitationRpcError(error);
      const code =
        mapped === INVITATION_ERROR_CODE.UNCONFIGURED ||
        mapped === INVITATION_ERROR_CODE.UNAUTHENTICATED ||
        mapped === INVITATION_ERROR_CODE.INVALID ||
        mapped === INVITATION_ERROR_CODE.NOT_FOUND ||
        mapped === INVITATION_ERROR_CODE.UNKNOWN
          ? mapped
          : INVITATION_ERROR_CODE.UNKNOWN;
      if (code === INVITATION_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.INVITATION_REVOKE, error, {
          invitationId: parsed.data,
        });
      }
      return { ok: false, code };
    }

    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.INVITATION_REVOKE, error, {
      invitationId: parsed.data,
    });
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
