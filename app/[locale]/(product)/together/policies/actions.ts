"use server";

import {
  updateHouseholdPolicies,
  type UpdateHouseholdPoliciesErrorCode,
} from "@/modules/tenancy/application/update-household-policies";
import type { HouseholdPoliciesInput } from "@/modules/tenancy/application/household-policies.schema";

export type UpdatePoliciesActionState =
  | { status: "success" }
  | { status: "error"; code: UpdateHouseholdPoliciesErrorCode };

export async function updatePoliciesAction(
  input: HouseholdPoliciesInput,
): Promise<UpdatePoliciesActionState> {
  const result = await updateHouseholdPolicies(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
