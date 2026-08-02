import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";

export type MoneyActionDeniedReason = "unauthenticated" | "no_membership";

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
    return { ok: false, reason: "unauthenticated" };
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return { ok: false, reason: "no_membership" };
  }

  return {
    ok: true,
    userId: user.id,
    householdId: membership.householdId,
  };
}
