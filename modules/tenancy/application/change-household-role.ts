import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  changeHouseholdRoleInputSchema,
  type ChangeHouseholdRoleInput,
} from "./change-household-role.schema";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_ROLE,
  type HouseholdErrorCode,
} from "./tenancy-constants";
import {
  classifyHouseholdRpcError,
  HOUSEHOLD_RPC_OPERATION,
  logTenancyFailure,
} from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type ChangeHouseholdRoleErrorCode = Extract<
  HouseholdErrorCode,
  | typeof HOUSEHOLD_ERROR_CODE.UNCONFIGURED
  | typeof HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED
  | typeof HOUSEHOLD_ERROR_CODE.INVALID
  | typeof HOUSEHOLD_ERROR_CODE.FORBIDDEN
  | typeof HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD
  | typeof HOUSEHOLD_ERROR_CODE.MEMBER_NOT_FOUND
  | typeof HOUSEHOLD_ERROR_CODE.UNKNOWN
>;

export type ChangeHouseholdRoleResult = Result<
  object,
  ChangeHouseholdRoleErrorCode
>;

export async function changeHouseholdRole(
  raw: ChangeHouseholdRoleInput,
): Promise<ChangeHouseholdRoleResult> {
  const parsed = changeHouseholdRoleInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: HOUSEHOLD_ERROR_CODE.INVALID };
  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED };
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD };
  }
  if (membership.role !== HOUSEHOLD_ROLE.ADMIN) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.FORBIDDEN };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("change_household_member_role", {
      p_membership_id: parsed.data.membershipId,
      p_role: parsed.data.role,
    });
    if (error) {
      const mapped = classifyHouseholdRpcError(
        error,
        HOUSEHOLD_RPC_OPERATION.ROLE,
      );
      const code =
        mapped === HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER
          ? HOUSEHOLD_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === HOUSEHOLD_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_ROLE, error, {
          membershipId: parsed.data.membershipId,
        });
      }
      return { ok: false, code };
    }
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_ROLE, error, {
      membershipId: parsed.data.membershipId,
    });
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
  }
}
