/**
 * Active household membership for money actions (AC-002 / REQ-002 / BR-02a).
 *
 * Fail-closed stub: no rewrite membership schema yet (S2 onboard).
 * Until membership can be proven, treat as absent.
 */
export type ActiveMembership = {
  householdId: string;
  userId: string;
  role: "partner" | "admin";
};

export async function resolveActiveMembership(
  userId: string,
): Promise<ActiveMembership | null> {
  void userId;
  return null;
}
