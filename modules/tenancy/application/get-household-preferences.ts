import { getHomeHouseholdContext } from "./get-home-household-context";
import {
  HOUSEHOLD_BASE_CURRENCY,
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_TIMEZONE,
} from "./tenancy-constants";
import type { HouseholdPreferencesInput } from "./household-preferences.schema";

export type HouseholdPreferences = HouseholdPreferencesInput & {
  householdName: string;
  canEdit: boolean;
};

export async function getHouseholdPreferences(): Promise<HouseholdPreferences | null> {
  const household = await getHomeHouseholdContext();
  if (!household) return null;

  return {
    householdName: household.householdName,
    locale:
      household.locale === HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
        ? HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
        : HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
    timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
    baseCurrency: HOUSEHOLD_BASE_CURRENCY.VIETNAM_DONG,
    canEdit: household.canEdit,
  };
}
