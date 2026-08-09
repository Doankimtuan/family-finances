import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  HOUSEHOLD_BASE_CURRENCY,
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_ROLE,
  HOUSEHOLD_TIMEZONE,
} from "./tenancy-constants";
import type { HouseholdPreferencesInput } from "./household-preferences.schema";

export type HouseholdPreferences = HouseholdPreferencesInput & {
  householdName: string;
  canEdit: boolean;
};

export async function getHouseholdPreferences(): Promise<HouseholdPreferences | null> {
  if (!getSupabaseEnv().isConfigured) return null;

  const user = await getSessionUser();
  if (!user) return null;
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("households")
      .select("name, locale, timezone, base_currency")
      .eq("id", membership.householdId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      householdName: data.name,
      locale:
        data.locale === HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
          ? HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
          : HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
      timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
      baseCurrency: HOUSEHOLD_BASE_CURRENCY.VIETNAM_DONG,
      canEdit: membership.role === HOUSEHOLD_ROLE.ADMIN,
    };
  } catch {
    return null;
  }
}
