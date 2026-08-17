import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  householdPoliciesInputSchema,
  type HouseholdPoliciesInput,
} from "./household-policies.schema";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
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

export type UpdateHouseholdPoliciesErrorCode = Extract<
  HouseholdErrorCode,
  | typeof HOUSEHOLD_ERROR_CODE.UNCONFIGURED
  | typeof HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED
  | typeof HOUSEHOLD_ERROR_CODE.INVALID
  | typeof HOUSEHOLD_ERROR_CODE.FORBIDDEN
  | typeof HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD
  | typeof HOUSEHOLD_ERROR_CODE.UNKNOWN
>;

export type UpdateHouseholdPoliciesResult = Result<
  { householdId: string },
  UpdateHouseholdPoliciesErrorCode
>;

/**
 * Admin-only policy save with partner-visible audit event (AC-007 / AC-013 / AC-020).
 */
export async function updateHouseholdPolicies(
  raw: HouseholdPoliciesInput,
): Promise<UpdateHouseholdPoliciesResult> {
  const parsed = householdPoliciesInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.INVALID };
  }

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
    const { data, error } = await supabase.rpc("update_household_policies", {
      p_overspend_policy: parsed.data.overspendPolicy,
      p_month_close_mode: parsed.data.monthCloseMode,
      p_income_allocate_mode: parsed.data.incomeAllocateMode,
    });

    if (error) {
      const mapped = classifyHouseholdRpcError(
        error,
        HOUSEHOLD_RPC_OPERATION.SETTINGS,
      );
      const code =
        mapped === HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER ||
        mapped === HOUSEHOLD_ERROR_CODE.MEMBER_NOT_FOUND
          ? HOUSEHOLD_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === HOUSEHOLD_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_POLICIES, error, {
          householdId: membership.householdId,
        });
      }
      return { ok: false, code };
    }

    if (typeof data !== "string" || data.length === 0) {
      logTenancyFailure(
        TENANCY_OPERATION.HOUSEHOLD_POLICIES,
        new Error("update household policies returned an invalid id"),
        { householdId: membership.householdId },
      );
      return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, householdId: data };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_POLICIES, error, {
      householdId: membership.householdId,
    });
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
  }
}
