import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { logTenancyFailure } from "./tenancy-error";
import { HOUSEHOLD_ROLE, TENANCY_OPERATION } from "./tenancy-constants";

/**
 * Active household membership for money actions (AC-002 / REQ-002 / BR-02a / BR-12).
 * Calls without an explicit client are memoized for the server render.
 */
export type ActiveMembership = {
  membershipId: string;
  householdId: string;
  userId: string;
  role: (typeof HOUSEHOLD_ROLE)[keyof typeof HOUSEHOLD_ROLE];
};

async function loadActiveMembership(
  userId: string,
  client?: SupabaseClient,
): Promise<ActiveMembership | null> {
  if (!userId || !getSupabaseEnv().isConfigured) {
    return null;
  }

  try {
    const supabase = client ?? (await createSupabaseServerClient());
    const { data, error } = await withPerfSpan(
      PERF_TRACE_OP.MEMBERSHIP_RESOLVE,
      async () =>
        supabase
          .from("household_members")
          .select("id, household_id, role, user_id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle(),
    );

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_RESOLVE, error, {
        userId,
      });
      return null;
    }
    if (!data) {
      return null;
    }

    const role =
      data.role === HOUSEHOLD_ROLE.PARTNER
        ? HOUSEHOLD_ROLE.PARTNER
        : HOUSEHOLD_ROLE.ADMIN;
    return {
      membershipId: data.id,
      householdId: data.household_id,
      userId: data.user_id,
      role,
    };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_RESOLVE, error, { userId });
    return null;
  }
}

export const resolveActiveMembership = cache(loadActiveMembership);
