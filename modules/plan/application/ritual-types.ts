import {
  RitualMode,
  RitualStatus,
  type RitualMode as RitualModeValue,
  type RitualStatus as RitualStatusValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
} from "./plan-constants";

export { RitualMode, RitualStatus, IncomeAllocateMode } from "./plan-constants";

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

export type MonthRitual = {
  id: string | null;
  householdId: string;
  periodMonth: string;
  status: RitualStatusValue;
  mode: RitualModeValue;
  preview: RitualPreview;
  approvedAt: string | null;
  correctionNote: string | null;
  isLocked: boolean;
};

export function mapRitualStatus(
  value: string | null | undefined,
): RitualStatusValue {
  switch (value) {
    case RitualStatus.PREVIEWED:
    case RitualStatus.APPROVED:
    case RitualStatus.CORRECTED:
      return value;
    default:
      return RitualStatus.DRAFT;
  }
}

export function mapRitualMode(
  value: string | null | undefined,
): RitualModeValue {
  if (value === RitualMode.AUTO || value === RitualMode.MANUAL) return value;
  return RitualMode.ASSISTED;
}
