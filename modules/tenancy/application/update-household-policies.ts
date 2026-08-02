import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  householdPoliciesInputSchema,
  type HouseholdPoliciesInput,
} from "./household-policies.schema";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_ROLE,
  INVITATION_RPC_MESSAGE_NEEDLE,
  type HouseholdErrorCode,
} from "./tenancy-constants";

export type UpdateHouseholdPoliciesErrorCode = Extract<
  HouseholdErrorCode,
  | typeof HOUSEHOLD_ERROR_CODE.UNCONFIGURED
  | typeof HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED
  | typeof HOUSEHOLD_ERROR_CODE.INVALID
  | typeof HOUSEHOLD_ERROR_CODE.FORBIDDEN
  | typeof HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD
  | typeof HOUSEHOLD_ERROR_CODE.UNKNOWN
>;

export type UpdateHouseholdPoliciesResult =
  | { ok: true; householdId: string }
  | { ok: false; code: UpdateHouseholdPoliciesErrorCode };

function mapError(message: string): UpdateHouseholdPoliciesErrorCode {
  const m = message.toLowerCase();
  if (m.includes("admin role")) return HOUSEHOLD_ERROR_CODE.FORBIDDEN;
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.NO_ACTIVE_HOUSEHOLD)) {
    return HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD;
  }
  if (m.includes(INVITATION_RPC_MESSAGE_NEEDLE.AUTHENTICATION)) {
    return HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED;
  }
  if (m.includes("invalid")) return HOUSEHOLD_ERROR_CODE.INVALID;
  return HOUSEHOLD_ERROR_CODE.UNKNOWN;
}

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
      return { ok: false, code: mapError(error.message ?? "") };
    }

    if (typeof data !== "string" || data.length === 0) {
      return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, householdId: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { ok: false, code: mapError(message) };
  }
}
