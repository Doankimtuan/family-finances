import { FINANCIAL_SCOPE, type FinancialScope } from "./financial-scope";

export type FinancialOwnership = {
  financialScope: FinancialScope;
  ownerMembershipId: string | null;
};

export type FinancialCapabilities = FinancialOwnership & {
  isPersonal: boolean;
  isOwnedByMe: boolean;
  canMutate: boolean;
};

export function normalizeCreationOwnership(
  financialScope: FinancialScope,
  activeMembershipId: string,
): FinancialOwnership {
  return {
    financialScope,
    ownerMembershipId:
      financialScope === FINANCIAL_SCOPE.PERSONAL ? activeMembershipId : null,
  };
}

export function resolveFinancialCapabilities(
  ownership: FinancialOwnership,
  activeMembershipId: string,
): FinancialCapabilities {
  const isPersonal = ownership.financialScope === FINANCIAL_SCOPE.PERSONAL;
  const isOwnedByMe =
    isPersonal && ownership.ownerMembershipId === activeMembershipId;

  return {
    ...ownership,
    isPersonal,
    isOwnedByMe,
    canMutate: !isPersonal || isOwnedByMe,
  };
}
