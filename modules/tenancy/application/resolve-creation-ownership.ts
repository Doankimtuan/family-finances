import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import { normalizeCreationOwnership } from "@/modules/shared-kernel/application/financial-ownership";
import { assertMoneyActionAllowed } from "./assert-money-action-allowed";

export type CreationOwnership = {
  financialScope: FinancialScope;
  ownerMembershipId: string | null;
};

export async function resolveCreationOwnership(
  householdId: string,
  financialScope: FinancialScope,
): Promise<CreationOwnership | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || gate.householdId !== householdId) return null;

  return normalizeCreationOwnership(financialScope, gate.membershipId);
}
