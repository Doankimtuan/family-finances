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
