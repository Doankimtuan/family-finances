import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { inviteEmailSchema, type InviteEmailInput } from "./invitation.schema";
import { getSessionUser } from "./get-session-user";
import {
  INVITATION_ERROR_CODE,
  type InvitationErrorCode,
} from "./tenancy-constants";
import { classifyInvitationRpcError, logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type CreateInvitationErrorCode = Exclude<
  InvitationErrorCode,
  | typeof INVITATION_ERROR_CODE.NOT_FOUND
  | typeof INVITATION_ERROR_CODE.NOT_PENDING
  | typeof INVITATION_ERROR_CODE.EXPIRED
  | typeof INVITATION_ERROR_CODE.EMAIL_MISMATCH
>;

export type CreateInvitationResult = Result<
  { invitationId: string; token: string; expiresAt: string },
  CreateInvitationErrorCode
>;

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
      const mapped = classifyInvitationRpcError(error);
      const code =
        mapped === INVITATION_ERROR_CODE.NOT_FOUND ||
        mapped === INVITATION_ERROR_CODE.NOT_PENDING ||
        mapped === INVITATION_ERROR_CODE.EXPIRED ||
        mapped === INVITATION_ERROR_CODE.EMAIL_MISMATCH
          ? INVITATION_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === INVITATION_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.INVITATION_CREATE, error);
      }
      return { ok: false, code };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (
      !row ||
      typeof row.invitation_id !== "string" ||
      typeof row.token !== "string"
    ) {
      logTenancyFailure(
        TENANCY_OPERATION.INVITATION_CREATE,
        new Error("create invitation returned an invalid payload"),
      );
      return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      invitationId: row.invitation_id,
      token: row.token,
      expiresAt: String(row.expires_at),
    };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.INVITATION_CREATE, error);
    return { ok: false, code: INVITATION_ERROR_CODE.UNKNOWN };
  }
}
