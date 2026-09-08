import { cache } from "react";
import { getSessionMembership } from "./get-session-membership";
import {
  MONEY_ACTION_DENIED_REASON,
  type MoneyActionDeniedReason,
} from "./tenancy-constants";

export type { MoneyActionDeniedReason };

export type MoneyActionAllowance =
  | {
      ok: true;
      userId: string;
      householdId: string;
      membershipId: string;
    }
  | { ok: false; reason: MoneyActionDeniedReason };

/**
 * AC-002 fail-closed gate for money mutations and data reads.
 * Memoized for one server render so parallel dashboard queries reuse the same
 * authenticated household allowance without sharing identity across requests.
 */
export const assertMoneyActionAllowed = cache(
  async (): Promise<MoneyActionAllowance> => {
    const { user, membership } = await getSessionMembership();
    if (!user) {
      return { ok: false, reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED };
    }

    if (!membership) {
      return { ok: false, reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP };
    }

    return {
      ok: true,
      userId: user.id,
      householdId: membership.householdId,
      membershipId: membership.membershipId,
    };
  },
);
