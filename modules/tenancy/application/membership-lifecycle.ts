import { z } from "zod";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  HOUSEHOLD_ERROR_CODE,
  HOUSEHOLD_ROLE,
  MEMBERSHIP_RPC,
  TENANCY_OPERATION,
  type HouseholdErrorCode,
} from "./tenancy-constants";
import {
  classifyHouseholdRpcError,
  HOUSEHOLD_RPC_OPERATION,
  logTenancyFailure,
} from "./tenancy-error";

const membershipIdSchema = z.string().uuid();

export type MembershipImpactSummary = {
  accounts: number;
  savings: number;
  investments: number;
  loans: number;
  liabilities: number;
  total: number;
};

export const EMPTY_MEMBERSHIP_IMPACT: MembershipImpactSummary = {
  accounts: 0,
  savings: 0,
  investments: 0,
  loans: 0,
  liabilities: 0,
  total: 0,
};

type LifecycleResult = Result<object, HouseholdErrorCode>;

function countRows(
  rows: Array<{ owner_membership_id: string | null }> | null,
  membershipId: string,
): number {
  return (rows ?? []).filter((row) => row.owner_membership_id === membershipId)
    .length;
}

export async function listMembershipImpactSummaries(
  membershipIds: readonly string[],
): Promise<Record<string, MembershipImpactSummary>> {
  if (membershipIds.length === 0 || !getSupabaseEnv().isConfigured) {
    return {};
  }

  const user = await getSessionUser();
  if (!user) return {};

  const membershipIdSet = new Set(membershipIds);
  const summaries = Object.fromEntries(
    membershipIds.map((membershipId) => [
      membershipId,
      { ...EMPTY_MEMBERSHIP_IMPACT },
    ]),
  );

  try {
    const membership = await resolveActiveMembership(user.id);
    if (!membership) return {};

    const supabase = await createSupabaseServerClient();
    const [accounts, savings, investments, loans, liabilities] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("owner_membership_id")
          .eq("household_id", membership.householdId)
          .in("owner_membership_id", [...membershipIdSet]),
        supabase
          .from("savings")
          .select("owner_membership_id")
          .eq("household_id", membership.householdId)
          .in("owner_membership_id", [...membershipIdSet]),
        supabase
          .from("investment_holdings")
          .select("owner_membership_id")
          .eq("household_id", membership.householdId)
          .in("owner_membership_id", [...membershipIdSet]),
        supabase
          .from("loans")
          .select("owner_membership_id")
          .eq("household_id", membership.householdId)
          .in("owner_membership_id", [...membershipIdSet]),
        supabase
          .from("liabilities")
          .select("owner_membership_id")
          .eq("household_id", membership.householdId)
          .in("owner_membership_id", [...membershipIdSet]),
      ]);

    const failed = [accounts, savings, investments, loans, liabilities].find(
      (result) => result.error,
    );
    if (failed?.error) {
      logTenancyFailure(
        TENANCY_OPERATION.MEMBERSHIP_IMPACT_QUERY,
        failed.error,
        {
          householdId: membership.householdId,
        },
      );
      return {};
    }

    for (const membershipId of membershipIds) {
      const summary = summaries[membershipId];
      if (!summary) continue;
      summary.accounts = countRows(accounts.data, membershipId);
      summary.savings = countRows(savings.data, membershipId);
      summary.investments = countRows(investments.data, membershipId);
      summary.loans = countRows(loans.data, membershipId);
      summary.liabilities = countRows(liabilities.data, membershipId);
      summary.total =
        summary.accounts +
        summary.savings +
        summary.investments +
        summary.loans +
        summary.liabilities;
    }

    return summaries;
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_IMPACT_QUERY, error);
    return {};
  }
}

export async function leaveHousehold(): Promise<LifecycleResult> {
  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc(MEMBERSHIP_RPC.LEAVE);
    if (error) {
      return {
        ok: false,
        code: classifyHouseholdRpcError(
          error,
          HOUSEHOLD_RPC_OPERATION.LIFECYCLE,
        ),
      };
    }
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_LIFECYCLE, error, {
      action: MEMBERSHIP_RPC.LEAVE,
    });
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
  }
}

export async function removeHouseholdMember(
  membershipId: string,
): Promise<LifecycleResult> {
  const parsed = membershipIdSchema.safeParse(membershipId);
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
    const { error } = await supabase.rpc(MEMBERSHIP_RPC.REMOVE, {
      p_membership_id: parsed.data,
    });
    if (error) {
      return {
        ok: false,
        code: classifyHouseholdRpcError(
          error,
          HOUSEHOLD_RPC_OPERATION.LIFECYCLE,
        ),
      };
    }
    return { ok: true };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.MEMBERSHIP_LIFECYCLE, error, {
      action: MEMBERSHIP_RPC.REMOVE,
      membershipId: parsed.data,
    });
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
  }
}
