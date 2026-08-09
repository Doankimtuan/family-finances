"use server";

import {
  changeHouseholdRole,
  type ChangeHouseholdRoleErrorCode,
} from "@/modules/tenancy/application/change-household-role";
import type { ChangeHouseholdRoleInput } from "@/modules/tenancy/application/change-household-role.schema";

export type ChangeRoleActionState =
  | { status: "success" }
  | { status: "error"; code: ChangeHouseholdRoleErrorCode };

export async function changeRoleAction(
  input: ChangeHouseholdRoleInput,
): Promise<ChangeRoleActionState> {
  const result = await changeHouseholdRole(input);
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}
