import {
  RitualMode,
  RitualStatus,
  RITUAL_LOCKED_STATUSES,
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  RITUAL_GATE_ERROR_CODE,
  type RitualMode as RitualModeValue,
  type RitualStatus as RitualStatusValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
  type RitualGateErrorCode,
} from "./plan-constants";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import { isQuickCloseEligible } from "./ritual-period";

export { RitualMode, RitualStatus, IncomeAllocateMode } from "./plan-constants";
export { RITUAL_GATE_ERROR_CODE };

/** Product + ritual-gate codes returned by Month Ritual mutations. */
export type RitualActionErrorCode =
  ProductActionErrorCode | RitualGateErrorCode;

export type RitualPreview = {
  periodMonth: string;
  activeJarCount: number;
  pausedJarCount: number;
  archivedJarCount: number;
  openInboxCount: number;
  activeGoalCount: number;
  recurringActiveCount: number;
  incomeAllocateMode: IncomeAllocateModeValue;
  monthCloseMode: RitualModeValue;
};

/** Category lacking an active Jar binding in the ritual period (Step 1). */
export type RitualDivergenceItem = {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
};

/** Emergency plan movement surfaced in Step 3 reflection. */
export type RitualEmergencyItem = {
  id: string;
  amount: number;
  intentNote: string | null;
  sourceJarId: string;
  targetJarId: string;
  createdAt: string;
};

export type MonthRitual = {
  id: string | null;
  householdId: string;
  periodMonth: string;
  status: RitualStatusValue;
  mode: RitualModeValue;
  preview: RitualPreview;
  approvedAt: string | null;
  correctionNote: string | null;
  autoLockedAt: string | null;
  isLocked: boolean;
  divergence: RitualDivergenceItem[];
  emergencies: RitualEmergencyItem[];
  emergenciesAcknowledged: boolean;
  consecutiveCompletedRituals: number;
  quickCloseEligible: boolean;
};

export function isRitualLockedStatus(status: RitualStatusValue): boolean {
  return (RITUAL_LOCKED_STATUSES as readonly string[]).includes(status);
}

export function mapRitualStatus(
  value: string | null | undefined,
): RitualStatusValue {
  switch (value) {
    case RitualStatus.PREVIEWED:
    case RitualStatus.APPROVED:
    case RitualStatus.CORRECTED:
    case RitualStatus.PENDING_REVIEW:
      return value;
    default:
      return RitualStatus.DRAFT;
  }
}

export function mapRitualMode(
  value: string | null | undefined,
): RitualModeValue {
  if (
    value === RitualMode.AUTO ||
    value === RitualMode.MANUAL ||
    value === RitualMode.QUICK_CLOSE
  ) {
    return value;
  }
  return RitualMode.ASSISTED;
}

export function resolveQuickCloseEligible(
  consecutiveCompleted: number,
): boolean {
  return isQuickCloseEligible(
    consecutiveCompleted,
    QUICK_CLOSE_CONSECUTIVE_RITUALS,
  );
}
