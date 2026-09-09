/**
 * Presentation-only credit-card facility completeness.
 * Domain already treats a non-positive creditLimit as "no limit"
 * (`utilizationForDisplay` / utilizationPercent). This helper does not
 * calculate available credit, utilization, or outstanding.
 */
export const CreditFacilityState = {
  COMPLETE: "complete",
  INCOMPLETE: "incomplete",
} as const;

export type CreditFacilityState =
  (typeof CreditFacilityState)[keyof typeof CreditFacilityState];

export function isCreditFacilityComplete(creditLimit: number): boolean {
  return creditLimit > 0;
}

export function creditFacilityStateFromComplete(
  complete: boolean,
): CreditFacilityState {
  return complete
    ? CreditFacilityState.COMPLETE
    : CreditFacilityState.INCOMPLETE;
}
