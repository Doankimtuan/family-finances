/** One percentage point is represented by 100 basis points. */
export const BASIS_POINTS_PER_PERCENT = 100;

/**
 * Converts a user-entered percentage to whole basis points.
 * Non-finite and negative values are treated as zero; domain schemas own any
 * upper-bound validation.
 */
export function percentageToBasisPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * BASIS_POINTS_PER_PERCENT));
}

/** Converts stored basis points to percentage points without display rounding. */
export function basisPointsToPercentage(value: number): number {
  return Number.isFinite(value) ? value / BASIS_POINTS_PER_PERCENT : 0;
}
