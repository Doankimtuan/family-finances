"use server";

import {
  updateHouseholdPreferences,
  type UpdateHouseholdPreferencesErrorCode,
} from "@/modules/tenancy/application/update-household-preferences";
import type { HouseholdPreferencesInput } from "@/modules/tenancy/application/household-preferences.schema";

export type UpdatePreferencesActionState =
  | { status: "success" }
  | { status: "error"; code: UpdateHouseholdPreferencesErrorCode };

export async function updatePreferencesAction(
  input: HouseholdPreferencesInput,
): Promise<UpdatePreferencesActionState> {
  const result = await updateHouseholdPreferences(input);
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}
