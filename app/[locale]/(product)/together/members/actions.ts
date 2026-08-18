"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import {
  changeHouseholdRole,
  type ChangeHouseholdRoleErrorCode,
} from "@/modules/tenancy/application/change-household-role";
import type { ChangeHouseholdRoleInput } from "@/modules/tenancy/application/change-household-role.schema";
import {
  leaveHousehold,
  removeHouseholdMember,
} from "@/modules/tenancy/application/membership-lifecycle";
import {
  APP_PATH,
  type HouseholdErrorCode,
} from "@/modules/tenancy/application/tenancy-constants";

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

export type MembershipLifecycleActionState =
  { status: "success" } | { status: "error"; code: HouseholdErrorCode };

export async function leaveHouseholdAction(): Promise<MembershipLifecycleActionState> {
  const result = await leaveHousehold();
  if (!result.ok) return { status: "error", code: result.code };
  const locale = await getLocale();
  redirect({ href: APP_PATH.ONBOARD, locale });
  return { status: "success" };
}

export async function removeHouseholdMemberAction(
  membershipId: string,
): Promise<MembershipLifecycleActionState> {
  const result = await removeHouseholdMember(membershipId);
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}
