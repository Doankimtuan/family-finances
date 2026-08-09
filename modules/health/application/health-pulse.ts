import {
  HEALTH_SOURCE_TOTAL,
  HealthAssessmentState,
  type HealthAssessmentState as HealthAssessmentStateValue,
} from "./health-constants";

/**
 * Financial Health pulse for Home chip (ST-E07-001 / AC-015).
 * Heuristic from household setup + Inbox load — never invents bank balances (BR-01).
 */

export const HealthLevel = {
  STARTING: "starting",
  STEADY: "steady",
  STRONG: "strong",
} as const;

export type HealthLevel = (typeof HealthLevel)[keyof typeof HealthLevel];

export type HealthPulseInput = {
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
};

export type HealthPulse = {
  score: number;
  level: HealthLevel;
};

export type HealthAssessmentInput = HealthPulseInput & {
  recentTransactionCount: number;
};

export type HealthCompleteness = {
  visibleSourceCount: number;
  totalSourceCount: number;
  missingAccounts: boolean;
  missingPlan: boolean;
};

export type HealthAssessment = {
  state: HealthAssessmentStateValue;
  health: HealthPulse | null;
  completeness: HealthCompleteness;
};

export function computeHealthPulse(input: HealthPulseInput): HealthPulse {
  let score = 35;
  if (input.accountCount > 0) score += 25;
  if (input.activeJarCount > 0) score += 25;
  if (input.openInboxCount === 0) score += 15;
  else if (input.openInboxCount <= 2) score += 8;

  score = Math.max(0, Math.min(100, score));

  const level: HealthLevel =
    score >= 80
      ? HealthLevel.STRONG
      : score >= 55
        ? HealthLevel.STEADY
        : HealthLevel.STARTING;

  return { score, level };
}

export function assessHealthPulse(
  input: HealthAssessmentInput,
): HealthAssessment {
  const hasAccounts = input.accountCount > 0;
  const hasPlan = input.activeJarCount > 0;
  const hasInbox = input.openInboxCount > 0;
  const hasActivity = input.recentTransactionCount > 0;
  const visibleSourceCount = [
    hasAccounts,
    hasPlan,
    hasInbox,
    hasActivity,
  ].filter(Boolean).length;
  const completeness = {
    visibleSourceCount,
    totalSourceCount: HEALTH_SOURCE_TOTAL,
    missingAccounts: !hasAccounts,
    missingPlan: !hasPlan,
  };

  if (visibleSourceCount === 0) {
    return {
      state: HealthAssessmentState.NO_VISIBLE_FACTS,
      health: null,
      completeness,
    };
  }

  if (!hasAccounts || !hasPlan) {
    return {
      state: HealthAssessmentState.PARTIAL,
      health: null,
      completeness,
    };
  }

  const health = computeHealthPulse(input);
  return { state: health.level, health, completeness };
}
