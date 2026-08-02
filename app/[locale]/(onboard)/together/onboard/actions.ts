"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import {
  createHousehold,
  type CreateHouseholdErrorCode,
} from "@/modules/tenancy/application/create-household";
import type { CreateHouseholdInput } from "@/modules/tenancy/application/create-household.schema";
import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import { HOUSEHOLD_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";

export type CreateHouseholdActionState = {
  status: "error";
  code: CreateHouseholdErrorCode;
};

/**
 * Create household seeds then hard-redirect to Home.
 * Client replace+refresh left the wizard pending and flooded onboard RSC
 * fetches because this page also redirects once membership exists.
 */
export async function createHouseholdAction(
  input: CreateHouseholdInput,
): Promise<CreateHouseholdActionState> {
  const result = await createHousehold(input);
  if (result.ok) {
    const locale = await getLocale();
    return redirect({ href: pathForAuthEntry("home"), locale });
  }
  if (result.code === HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER) {
    const locale = await getLocale();
    return redirect({ href: pathForAuthEntry("home"), locale });
  }
  return { status: "error", code: result.code };
}
