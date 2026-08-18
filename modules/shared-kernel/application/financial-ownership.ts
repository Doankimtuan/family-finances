import { FINANCIAL_SCOPE, type FinancialScope } from "./financial-scope";

export const OWNER_STATUS = {
  ACTIVE: "active",
  FORMER: "former",
} as const;

export type OwnerStatus = (typeof OWNER_STATUS)[keyof typeof OWNER_STATUS];

export type FinancialOwnership = {
  financialScope: FinancialScope;
  ownerMembershipId: string | null;
};

export type FinancialCapabilities = FinancialOwnership & {
  isPersonal: boolean;
  isOwnedByMe: boolean;
  canMutate: boolean;
  ownerStatus: OwnerStatus;
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
  ownerMembershipIsActive = true,
): FinancialCapabilities {
  const isPersonal = ownership.financialScope === FINANCIAL_SCOPE.PERSONAL;
  const isOwnedByMe =
    isPersonal && ownership.ownerMembershipId === activeMembershipId;
  const ownerStatus =
    isPersonal && ownership.ownerMembershipId && !ownerMembershipIsActive
      ? OWNER_STATUS.FORMER
      : OWNER_STATUS.ACTIVE;

  return {
    ...ownership,
    isPersonal,
    isOwnedByMe,
    canMutate:
      !isPersonal || (isOwnedByMe && ownerStatus === OWNER_STATUS.ACTIVE),
    ownerStatus,
  };
}
