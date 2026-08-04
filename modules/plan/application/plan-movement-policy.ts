import { OverspendPolicy } from "@/modules/tenancy/application/household-policies.schema";
import {
  CapacityMovementDirection,
  PLAN_MOVEMENT_LEDGER_IMPACT,
  type CapacityMovementDirection as CapacityMovementDirectionValue,
} from "./plan-constants";

/**
 * BR-07 — mid-month overspend warning is bypassed for EmergencyDeclaration.
 * Does not bypass BR-06 / OverspendPolicy.BLOCK capacity floor.
 */
export function shouldShowOverspendWarning(input: {
  isEmergency: boolean;
  overspendPolicy: string;
}): boolean {
  if (input.isEmergency) return false;
  return input.overspendPolicy === OverspendPolicy.WARN;
}

/**
 * BR-06 — BLOCK policy refuses moves that would drive source capacity below zero.
 * Emergency does not bypass BLOCK (only WARN).
 */
export function isCapacityMoveBlocked(input: {
  overspendPolicy: string;
  sourceCapacityDelta: number;
  amount: number;
}): boolean {
  if (input.overspendPolicy !== OverspendPolicy.BLOCK) {
    return false;
  }
  return input.sourceCapacityDelta < input.amount;
}

/**
 * Emergency reallocations require a non-empty intent note (EVO-06).
 */
export function isEmergencyIntentValid(input: {
  isEmergency: boolean;
  intentNote: string | null | undefined;
}): boolean {
  if (!input.isEmergency) return true;
  return Boolean(input.intentNote && input.intentNote.trim().length > 0);
}

/** AC-JAR-01 — plan movement must leave ledger + accounts untouched. */
export function isZeroLedgerImpact(input: {
  ledgerTransactionsCreated: number;
  ledgerImpact: number;
}): boolean {
  return (
    input.ledgerTransactionsCreated === 0 &&
    input.ledgerImpact === PLAN_MOVEMENT_LEDGER_IMPACT
  );
}

/**
 * Virtual jar capacity after a plan movement (intention only).
 */
export function applyCapacityDelta(
  capacityDelta: number,
  movement: {
    direction: CapacityMovementDirectionValue;
    amount: number;
  },
): number {
  if (movement.direction === CapacityMovementDirection.OUT) {
    return capacityDelta - movement.amount;
  }
  return capacityDelta + movement.amount;
}

/**
 * AC-JAR-01 — bank / account balances must be unchanged by a plan movement.
 * Compares opening+ledger totals before vs after (same reference).
 */
export function areBankBalancesUnchanged(
  beforeTotal: number,
  afterTotal: number,
): boolean {
  return beforeTotal === afterTotal;
}

/**
 * BR-13 — partner alert is for assignees other than the declarer.
 */
export function isPartnerEmergencyAlert(input: {
  kind: string;
  executedByUserId: string | null | undefined;
  assignedToUserId: string | null | undefined;
  viewerUserId: string;
  emergencyKind: string;
}): boolean {
  if (input.kind !== input.emergencyKind) {
    return false;
  }
  if (input.assignedToUserId) {
    return input.assignedToUserId === input.viewerUserId;
  }
  // Legacy household-wide rows: hide from declarer, show to others
  if (input.executedByUserId && input.executedByUserId === input.viewerUserId) {
    return false;
  }
  return true;
}
