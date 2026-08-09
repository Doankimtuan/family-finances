import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  householdPreferencesInputSchema,
  type HouseholdPreferencesInput,
} from "./household-preferences.schema";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_ROLE,
  type HouseholdErrorCode,
} from "./tenancy-constants";

export type UpdateHouseholdPreferencesErrorCode = Extract<
  HouseholdErrorCode,
  | typeof HOUSEHOLD_ERROR_CODE.UNCONFIGURED
  | typeof HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED
  | typeof HOUSEHOLD_ERROR_CODE.INVALID
  | typeof HOUSEHOLD_ERROR_CODE.FORBIDDEN
  | typeof HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD
  | typeof HOUSEHOLD_ERROR_CODE.UNKNOWN
>;

export type UpdateHouseholdPreferencesResult =
  | { ok: true; householdId: string }
  | { ok: false; code: UpdateHouseholdPreferencesErrorCode };

function mapError(message: string): UpdateHouseholdPreferencesErrorCode {
  const normalized = message.toLowerCase();
  if (normalized.includes("admin role")) return HOUSEHOLD_ERROR_CODE.FORBIDDEN;
  if (normalized.includes("no active household")) {
    return HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD;
  }
  if (normalized.includes("authentication")) {
    return HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED;
  }
  if (normalized.includes("invalid")) return HOUSEHOLD_ERROR_CODE.INVALID;
  return HOUSEHOLD_ERROR_CODE.UNKNOWN;
}

export async function updateHouseholdPreferences(
  raw: HouseholdPreferencesInput,
): Promise<UpdateHouseholdPreferencesResult> {
  const parsed = householdPreferencesInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("update_household_preferences", {
      p_locale: parsed.data.locale,
      p_timezone: parsed.data.timezone,
      p_base_currency: parsed.data.baseCurrency,
    });
    if (error) return { ok: false, code: mapError(error.message ?? "") };
    if (typeof data !== "string" || data.length === 0) {
      return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, householdId: data };
  } catch (error) {
    return {
      ok: false,
      code: mapError(error instanceof Error ? error.message : ""),
    };
  }
}
