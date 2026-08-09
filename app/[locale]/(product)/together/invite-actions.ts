"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import {
  createInvitation,
  type CreateInvitationErrorCode,
} from "@/modules/tenancy/application/create-invitation";
import { revokeInvitation } from "@/modules/tenancy/application/revoke-invitation";
import type { RevokeInvitationErrorCode } from "@/modules/tenancy/application/revoke-invitation";
import {
  acceptInvitation,
  declineInvitation,
  type AcceptInvitationErrorCode,
  type DeclineInvitationErrorCode,
} from "@/modules/tenancy/application/accept-invitation";
import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";

export type CreateInvitationActionState = {
  status: "error";
  code: CreateInvitationErrorCode;
};

export async function createInvitationAction(input: {
  email: string;
}): Promise<CreateInvitationActionState> {
  const result = await createInvitation(input);
  if (result.ok) {
    const locale = await getLocale();
    return redirect({ href: TOGETHER_PATH.INVITATIONS, locale });
  }
  return { status: "error", code: result.code };
}

export type RevokeInvitationActionState =
  | { status: "success" }
  | {
      status: "error";
      code: RevokeInvitationErrorCode;
    };

export async function revokeInvitationAction(
  invitationId: string,
): Promise<RevokeInvitationActionState> {
  const result = await revokeInvitation(invitationId);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export type AcceptInvitationActionState = {
  status: "error";
  code: AcceptInvitationErrorCode;
};

export async function acceptInvitationAction(
  token: string,
): Promise<AcceptInvitationActionState> {
  const result = await acceptInvitation(token);
  if (result.ok) {
    const locale = await getLocale();
    return redirect({ href: pathForAuthEntry("home"), locale });
  }
  return { status: "error", code: result.code };
}

export type DeclineInvitationActionState = {
  status: "error";
  code: DeclineInvitationErrorCode;
};

export async function declineInvitationAction(
  token: string,
): Promise<DeclineInvitationActionState> {
  const result = await declineInvitation(token);
  if (result.ok) {
    const locale = await getLocale();
    return redirect({ href: pathForAuthEntry("welcome"), locale });
  }
  return { status: "error", code: result.code };
}
