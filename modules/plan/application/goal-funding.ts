import {
  GoalFundingSourceKind,
  GoalStatus,
  GoalType,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
} from "./plan-constants";

export type GoalFundingValueStatus =
  "current" | "stale" | "missing" | "incomplete" | "unavailable";
export type GoalFundingQuality =
  "current" | "stale" | "partial" | "missing" | "incomplete";

export type GoalFundingSourceValue = {
  kind: GoalFundingSourceKindValue;
  sourceId: string;
  currentAmount?: number | null;
  currency?: string | null;
  valueStatus?: GoalFundingValueStatus;
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
  valueStatus: GoalFundingValueStatus;
};

export type GoalFundingSummary = {
  fundedAmount: number;
  valueStatus: GoalFundingQuality;
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
function sourceStatus(source: GoalFundingSourceValue): GoalFundingValueStatus {
  return source.valueStatus ?? "current";
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
    const fundedContribution =
      status === "missing" ||
      status === "incomplete" ||
      status === "unavailable"
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
  const resolvedStatus = hasPrincipalData ? status : "incomplete";
  return {
    ...source,
    currentAmount: remainingPrincipal,
    originalPrincipal,
    remainingPrincipal,
    fundedContribution:
      resolvedStatus === "missing" || resolvedStatus === "unavailable"
        ? 0
        : (principalPaid ?? 0),
    unrealizedGainLoss: null,
    principalPaid,
    valueStatus: resolvedStatus,
  };
}

function aggregateQuality(
  sources: readonly GoalFundingSourceResolution[],
): GoalFundingQuality {
  if (sources.length === 0) return "current";
  const verified = sources.filter(
    (source) =>
      source.valueStatus !== "missing" &&
      source.valueStatus !== "incomplete" &&
      source.valueStatus !== "unavailable",
  );
  const hasStale = sources.some((source) => source.valueStatus === "stale");
  const hasMissing = sources.some(
    (source) =>
      source.valueStatus === "missing" || source.valueStatus === "unavailable",
  );
  const hasIncomplete = sources.some(
    (source) => source.valueStatus === "incomplete",
  );
  if (verified.length === 0)
    return hasMissing && !hasIncomplete ? "missing" : "incomplete";
  if (hasMissing || hasIncomplete) return "partial";
  if (hasStale) return "stale";
  return "current";
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
      (source) => source.valueStatus === "incomplete",
    ).length,
    staleSourceCount: resolved.filter(
      (source) => source.valueStatus === "stale",
    ).length,
    missingSourceCount: resolved.filter(
      (source) =>
        source.valueStatus === "missing" ||
        source.valueStatus === "unavailable",
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
    currentStatus === GoalStatus.COMPLETED ||
    currentStatus === GoalStatus.CANCELLED ||
    currentStatus === GoalStatus.PAUSED
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
