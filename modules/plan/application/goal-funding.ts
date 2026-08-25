import {
  GoalFundingQuality,
  GoalFundingSourceKind,
  GoalFundingValueStatus,
  GoalStatus,
  GoalType,
  type GoalFundingQuality as GoalFundingQualityValue,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
  type GoalFundingValueStatus as GoalFundingValueStatusValue,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
} from "./plan-constants";
import {
  MarketValuationQuality,
  type MarketValuationQuality as MarketValuationQualityValue,
} from "@/modules/investments/application/investment-constants";

export {
  GoalFundingQuality,
  GoalFundingValueStatus,
  GOAL_FUNDING_QUALITY_VALUES,
  GOAL_FUNDING_VALUE_STATUS_VALUES,
} from "./plan-constants";

export type GoalFundingSourceValue = {
  kind: GoalFundingSourceKindValue;
  sourceId: string;
  currentAmount?: number | null;
  currency?: string | null;
  valueStatus?: GoalFundingValueStatusValue;
  valuationQuality?: MarketValuationQualityValue;
  currentValue?: number | null;
  costBasis?: number | null;
  updatedAt?: string | null;
  originalPrincipal?: number | null;
  remainingPrincipal?: number | null;
  principalPaid?: number | null;
  initialPrincipalSnapshot?: number | null;
};

export type GoalFundingSourceResolution = GoalFundingSourceValue & {
  fundedContribution: number;
  unrealizedGainLoss: number | null;
  principalPaid: number | null;
  valueStatus: GoalFundingValueStatusValue;
  valuationQuality?: MarketValuationQualityValue;
};

export type GoalFundingSummary = {
  fundedAmount: number;
  valueStatus: GoalFundingQualityValue;
  sources: GoalFundingSourceResolution[];
  marketValue: number;
  costBasis: number;
  unrealizedGainLoss: number | null;
  originalPrincipalTotal: number;
  remainingPrincipalTotal: number;
  principalPaidTotal: number;
  incompleteSourceCount: number;
  staleSourceCount: number;
  missingSourceCount: number;
  unknownSourceCount: number;
  manualSourceCount: number;
};

export type GoalFundingLinkIdentity = {
  goalId: string;
  kind: GoalFundingSourceKindValue;
  sourceId: string;
  isActive: boolean;
};

function whole(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}
function nonnegative(value: number | null | undefined): number {
  return Math.max(0, whole(value) ?? 0);
}
function sourceStatus(
  source: GoalFundingSourceValue,
): GoalFundingValueStatusValue {
  return source.valueStatus ?? GoalFundingValueStatus.CURRENT;
}
function isZeroContributionStatus(
  status: GoalFundingValueStatusValue,
): boolean {
  return [
    GoalFundingValueStatus.UNKNOWN,
    GoalFundingValueStatus.MISSING,
    GoalFundingValueStatus.INCOMPLETE,
    GoalFundingValueStatus.UNAVAILABLE,
  ].includes(
    status as unknown as
      | typeof GoalFundingValueStatus.MISSING
      | typeof GoalFundingValueStatus.INCOMPLETE
      | typeof GoalFundingValueStatus.UNAVAILABLE,
  );
}
function isUnknownValueStatus(status: GoalFundingValueStatusValue): boolean {
  return status === GoalFundingValueStatus.UNKNOWN;
}
function isMissingValueStatus(status: GoalFundingValueStatusValue): boolean {
  return [
    GoalFundingValueStatus.MISSING,
    GoalFundingValueStatus.UNAVAILABLE,
  ].includes(
    status as unknown as
      | typeof GoalFundingValueStatus.MISSING
      | typeof GoalFundingValueStatus.UNAVAILABLE,
  );
}
export function isPayoffFundingSource(
  kind: GoalFundingSourceKindValue,
): boolean {
  return (
    kind === GoalFundingSourceKind.LOAN || kind === GoalFundingSourceKind.DEBT
  );
}
export function isAssetFundingSource(
  kind: GoalFundingSourceKindValue,
): boolean {
  return !isPayoffFundingSource(kind);
}
export function isGoalFundingSourceCompatible(
  goalType: GoalTypeValue,
  kind: GoalFundingSourceKindValue,
): boolean {
  return goalType === GoalType.PAYOFF
    ? isPayoffFundingSource(kind)
    : isAssetFundingSource(kind);
}

/** Resolve a linked Money source without creating a Plan-owned balance. */
export function resolveGoalFundingSource(
  source: GoalFundingSourceValue,
): GoalFundingSourceResolution {
  const status = sourceStatus(source);
  if (isAssetFundingSource(source.kind)) {
    const currentValue = whole(source.currentValue ?? source.currentAmount);
    const costBasis = whole(source.costBasis);
    const fundedContribution = isZeroContributionStatus(status)
      ? 0
      : nonnegative(currentValue);
    return {
      ...source,
      currentValue,
      costBasis,
      fundedContribution,
      unrealizedGainLoss:
        currentValue != null && costBasis != null
          ? currentValue - costBasis
          : null,
      principalPaid: null,
      valueStatus: status,
      valuationQuality: source.valuationQuality,
    };
  }
  const originalPrincipal = whole(
    source.initialPrincipalSnapshot ?? source.originalPrincipal,
  );
  const remainingPrincipal = whole(
    source.remainingPrincipal ?? source.currentAmount,
  );
  const hasPrincipalData =
    originalPrincipal != null && remainingPrincipal != null;
  const principalPaid = hasPrincipalData
    ? Math.max(0, originalPrincipal - remainingPrincipal)
    : null;
  const resolvedStatus = hasPrincipalData
    ? status
    : GoalFundingValueStatus.INCOMPLETE;
  return {
    ...source,
    currentAmount: remainingPrincipal,
    originalPrincipal,
    remainingPrincipal,
    fundedContribution: isMissingValueStatus(resolvedStatus)
      ? 0
      : (principalPaid ?? 0),
    unrealizedGainLoss: null,
    principalPaid,
    valueStatus: resolvedStatus,
  };
}

function aggregateQuality(
  sources: readonly GoalFundingSourceResolution[],
): GoalFundingQualityValue {
  if (sources.length === 0) return GoalFundingQuality.CURRENT;
  const verified = sources.filter(
    (source) => !isZeroContributionStatus(source.valueStatus),
  );
  const hasStale = sources.some(
    (source) => source.valueStatus === GoalFundingValueStatus.STALE,
  );
  const hasMissing = sources.some((source) =>
    isMissingValueStatus(source.valueStatus),
  );
  const hasUnknown = sources.some((source) =>
    isUnknownValueStatus(source.valueStatus),
  );
  const hasIncomplete = sources.some(
    (source) => source.valueStatus === GoalFundingValueStatus.INCOMPLETE,
  );
  if (hasUnknown) return GoalFundingQuality.INDETERMINATE;
  if (verified.length === 0)
    return hasMissing && !hasIncomplete
      ? GoalFundingQuality.MISSING
      : GoalFundingQuality.INCOMPLETE;
  if (hasMissing || hasIncomplete) return GoalFundingQuality.PARTIAL;
  if (hasStale) return GoalFundingQuality.STALE;
  return GoalFundingQuality.CURRENT;
}

export function deriveGoalFundingSummary(
  sources: readonly GoalFundingSourceValue[],
): GoalFundingSummary {
  const resolved = sources.map(resolveGoalFundingSource);
  const marketValue = resolved.reduce(
    (sum, source) =>
      sum +
      (isAssetFundingSource(source.kind)
        ? nonnegative(source.currentValue)
        : 0),
    0,
  );
  const costBasis = resolved.reduce(
    (sum, source) =>
      sum +
      (isAssetFundingSource(source.kind) ? nonnegative(source.costBasis) : 0),
    0,
  );
  const originalPrincipalTotal = resolved.reduce(
    (sum, source) =>
      sum +
      (isPayoffFundingSource(source.kind)
        ? nonnegative(source.originalPrincipal)
        : 0),
    0,
  );
  const remainingPrincipalTotal = resolved.reduce(
    (sum, source) =>
      sum +
      (isPayoffFundingSource(source.kind)
        ? nonnegative(source.remainingPrincipal)
        : 0),
    0,
  );
  const principalPaidTotal = resolved.reduce(
    (sum, source) =>
      sum +
      (isPayoffFundingSource(source.kind)
        ? nonnegative(source.principalPaid)
        : 0),
    0,
  );
  const unrealizedGainLoss = resolved.some(
    (source) => isAssetFundingSource(source.kind) && source.costBasis == null,
  )
    ? null
    : marketValue - costBasis;
  return {
    fundedAmount: Math.round(
      resolved.reduce((sum, source) => sum + source.fundedContribution, 0),
    ),
    valueStatus: aggregateQuality(resolved),
    sources: resolved,
    marketValue,
    costBasis,
    unrealizedGainLoss,
    originalPrincipalTotal,
    remainingPrincipalTotal,
    principalPaidTotal,
    incompleteSourceCount: resolved.filter(
      (source) => source.valueStatus === GoalFundingValueStatus.INCOMPLETE,
    ).length,
    staleSourceCount: resolved.filter(
      (source) => source.valueStatus === GoalFundingValueStatus.STALE,
    ).length,
    missingSourceCount: resolved.filter((source) =>
      isMissingValueStatus(source.valueStatus),
    ).length,
    unknownSourceCount: resolved.filter((source) =>
      isUnknownValueStatus(source.valueStatus),
    ).length,
    manualSourceCount: resolved.filter(
      (source) => source.valuationQuality === MarketValuationQuality.MANUAL,
    ).length,
  };
}

export function resolveGoalFundingSourceValue(
  source: GoalFundingSourceValue,
): number {
  return resolveGoalFundingSource(source).fundedContribution;
}
export function deriveGoalFundedAmount(
  sources: readonly GoalFundingSourceValue[],
  initialPrincipalSnapshot: number | null = null,
): number {
  void initialPrincipalSnapshot;
  return deriveGoalFundingSummary(sources).fundedAmount;
}
export function calculateGoalProgressPercent(
  fundedAmount: number,
  targetAmount: number,
): number {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return 0;
  return Math.max(
    0,
    Math.round((nonnegative(fundedAmount) / targetAmount) * 10000) / 100,
  );
}
export function resolveGoalFundingStatus(
  currentStatus: GoalStatusValue,
  fundedAmount: number,
  targetAmount: number,
): GoalStatusValue {
  if (
    [GoalStatus.COMPLETED, GoalStatus.CANCELLED, GoalStatus.PAUSED].includes(
      currentStatus as unknown as
        | typeof GoalStatus.COMPLETED
        | typeof GoalStatus.CANCELLED
        | typeof GoalStatus.PAUSED,
    )
  ) {
    return currentStatus;
  }
  if (targetAmount > 0 && fundedAmount >= targetAmount) return GoalStatus.READY;
  return currentStatus === GoalStatus.READY ? GoalStatus.ACTIVE : currentStatus;
}
export function goalFundingSourceKey(
  source: Pick<GoalFundingLinkIdentity, "kind" | "sourceId">,
): string {
  return `${source.kind}:${source.sourceId}`;
}
export function hasExclusiveGoalFundingConflict(
  links: readonly GoalFundingLinkIdentity[],
  candidate: Pick<GoalFundingLinkIdentity, "goalId" | "kind" | "sourceId">,
): boolean {
  const candidateKey = goalFundingSourceKey(candidate);
  return links.some(
    (link) =>
      link.isActive &&
      link.goalId !== candidate.goalId &&
      goalFundingSourceKey(link) === candidateKey,
  );
}
