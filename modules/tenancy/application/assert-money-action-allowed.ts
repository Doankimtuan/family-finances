import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  MONEY_ACTION_DENIED_REASON,
  type MoneyActionDeniedReason,
} from "./tenancy-constants";

export type { MoneyActionDeniedReason };

export type MoneyActionAllowance =
  | { ok: true; userId: string; householdId: string }
  | { ok: false; reason: MoneyActionDeniedReason };

/**
 * AC-002 fail-closed gate for money mutations / money write paths.
 * Authenticated active household membership is required.
 */
export async function assertMoneyActionAllowed(): Promise<MoneyActionAllowance> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED };
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return { ok: false, reason: MONEY_ACTION_DENIED_REASON.NO_MEMBERSHIP };
  }

  return {
    ok: true,
    userId: user.id,
    householdId: membership.householdId,
  };
}
