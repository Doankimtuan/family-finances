import {
  CycleStatus,
  MATURING_SOON_THRESHOLD_DAYS,
  SavingStatus,
  SavingsFamily,
  SavingsMaturityState,
} from "./savings-constants";
import {
  calculateSettlementBreakdown,
  EarlySettlementRule,
  SavingsTaxRule,
} from "./savings-domain-rules";
import type { Saving } from "./savings-types";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";

export const MaturityPresentationState = SavingsMaturityState;
export type MaturityPresentationState = SavingsMaturityState;

const MATURITY_ATTENTION_STATES: ReadonlySet<MaturityPresentationState> =
  new Set([
    MaturityPresentationState.MATURED,
    MaturityPresentationState.MATURE_TODAY,
    MaturityPresentationState.ACTION_REQUIRED,
  ]);

const MATURITY_SETTLED_STATES: ReadonlySet<MaturityPresentationState> =
  new Set([
    MaturityPresentationState.SETTLED,
    MaturityPresentationState.EARLY_SETTLED,
  ]);

export function isMaturityAttention(
  state: MaturityPresentationState,
): boolean {
  return MATURITY_ATTENTION_STATES.has(state);
}

function isMaturitySettled(state: MaturityPresentationState): boolean {
  return MATURITY_SETTLED_STATES.has(state);
}

export type SavingsPresentationItem = {
  saving: Saving;
  maturityState: MaturityPresentationState;
  daysUntilMaturity: number | null;
  progressRatio: number | null;
  principal: number;
  grossInterest: number;
  tax: number;
  fee: number;
  netInterest: number;
  totalCashReceived: number;
  actionRequired: boolean;
};

export type SavingsOverviewModel = {
  items: SavingsPresentationItem[];
  activeItems: SavingsPresentationItem[];
  historyItems: SavingsPresentationItem[];
  bankItems: SavingsPresentationItem[];
  platformItems: SavingsPresentationItem[];
  totalPrincipal: number;
  expectedGrossInterest: number;
  expectedTax: number;
  expectedNetInterest: number;
  expectedTotalCashReceived: number;
  attentionCount: number;
};

export type SavingsDetailModel = SavingsPresentationItem & {
  elapsedDays: number | null;
  totalTermDays: number | null;
  canSettle: boolean;
  canSettleEarly: boolean;
  canSettlePartially: boolean;
  isTerminal: boolean;
};

/**
 * Maturity presentation is derived from the cycle end date, not only from the
 * persisted `matured` status: flipping that status is a lifecycle mutation
 * (detect_matured_savings RPC), so a read-only render must stay truthful even
 * before detection has run. Persisted lifecycle actions (settle/renew) still
 * gate on the stored status.
 */
export function deriveMaturityPresentationState(
  saving: Saving,
  today = todayIsoDate(),
): MaturityPresentationState {
  if (saving.status === SavingStatus.CLOSED)
    return MaturityPresentationState.SETTLED;
  if (saving.status === SavingStatus.EARLY_CLOSED)
    return MaturityPresentationState.EARLY_SETTLED;
  if (saving.maturityActionRequired)
    return MaturityPresentationState.ACTION_REQUIRED;
  const cycle = saving.latestCycle;
  if (!cycle) return MaturityPresentationState.ACTIVE;
  const daysUntilMaturity = differenceInUtcCalendarDays(today, cycle.endDate);
  const isMatured =
    cycle.status === CycleStatus.MATURED ||
    saving.status === SavingStatus.MATURED ||
    daysUntilMaturity <= 0;
  if (isMatured) {
    return daysUntilMaturity === 0
      ? MaturityPresentationState.MATURE_TODAY
      : MaturityPresentationState.MATURED;
  }
  if (daysUntilMaturity <= MATURING_SOON_THRESHOLD_DAYS) {
    return MaturityPresentationState.MATURING_SOON;
  }
  return MaturityPresentationState.ACTIVE;
}

export function maturityDaysRemaining(
  saving: Saving,
  today = todayIsoDate(),
): number | null {
  const endDate = saving.latestCycle?.endDate;
  if (!endDate) return null;
  return differenceInUtcCalendarDays(today, endDate);
}

function sortPriority(state: MaturityPresentationState): number {
  switch (state) {
    case MaturityPresentationState.ACTION_REQUIRED:
      return -1;
    case MaturityPresentationState.MATURED:
    case MaturityPresentationState.MATURE_TODAY:
      return 0;
    case MaturityPresentationState.MATURING_SOON:
      return 1;
    case MaturityPresentationState.ACTIVE:
      return 2;
    case MaturityPresentationState.EARLY_SETTLED:
    case MaturityPresentationState.SETTLED:
      return 3;
  }
}

export function buildSavingsPresentationItem(
  saving: Saving,
  today = todayIsoDate(),
): SavingsPresentationItem {
  const cycle = saving.latestCycle;
  const principal = cycle?.principal ?? 0;
  const grossInterest = cycle?.accruedInterest ?? 0;
  const breakdown = calculateSettlementBreakdown({
    principal,
    grossInterest,
    taxRule:
      cycle?.packageSnapshot?.taxRule ??
      saving.productSnapshot.taxRule ??
      SavingsTaxRule.NONE,
    taxRatePercent:
      cycle?.packageSnapshot?.taxRatePercent ??
      saving.productSnapshot.taxRatePercent ??
      0,
  });
  const daysUntilMaturity = maturityDaysRemaining(saving, today);
  const totalDays = cycle
    ? Math.max(
        0,
        differenceInUtcCalendarDays(cycle.startDate, cycle.endDate),
      )
    : 0;
  const elapsedDays = cycle
    ? Math.max(
        0,
        differenceInUtcCalendarDays(cycle.startDate, today),
      )
    : 0;
  return {
    saving,
    maturityState: deriveMaturityPresentationState(saving, today),
    daysUntilMaturity,
    progressRatio: totalDays > 0 ? Math.min(1, elapsedDays / totalDays) : null,
    principal,
    grossInterest: breakdown.grossInterest,
    tax: breakdown.tax,
    fee: breakdown.fee,
    netInterest: breakdown.netInterest,
    totalCashReceived: breakdown.totalCashReceived,
    actionRequired: saving.maturityActionRequired === true,
  };
}

export function buildSavingsDetailModel(
  saving: Saving,
  today = todayIsoDate(),
): SavingsDetailModel {
  const base = buildSavingsPresentationItem(saving, today);
  const cycle = saving.latestCycle;
  const totalTermDays = cycle
    ? Math.max(
        0,
        differenceInUtcCalendarDays(cycle.startDate, cycle.endDate),
      )
    : null;
  const elapsedDays = cycle
    ? Math.max(
        0,
        differenceInUtcCalendarDays(cycle.startDate, today),
      )
    : null;
  const isTerminal = isMaturitySettled(base.maturityState);
  const earlyRule = saving.productSnapshot.earlySettlementRule;
  return {
    ...base,
    elapsedDays,
    totalTermDays,
    canSettle: isMaturityAttention(base.maturityState),
    canSettleEarly:
      base.maturityState === MaturityPresentationState.ACTIVE ||
      base.maturityState === MaturityPresentationState.MATURING_SOON
        ? earlyRule != null && earlyRule !== EarlySettlementRule.NOT_ALLOWED
        : false,
    canSettlePartially:
      !isTerminal && saving.productSnapshot.supportsPartialSettlement === true,
    isTerminal,
  };
}

export function sortSavingsPresentationItems(
  items: SavingsPresentationItem[],
): SavingsPresentationItem[] {
  return [...items].sort((a, b) => {
    const priority =
      sortPriority(a.maturityState) - sortPriority(b.maturityState);
    if (priority !== 0) return priority;
    const aDate = a.saving.latestCycle?.endDate ?? "9999-12-31";
    const bDate = b.saving.latestCycle?.endDate ?? "9999-12-31";
    return (
      aDate.localeCompare(bDate) ||
      a.saving.createdAt.localeCompare(b.saving.createdAt)
    );
  });
}

export function buildSavingsOverviewModel(
  savings: Saving[],
  today = todayIsoDate(),
): SavingsOverviewModel {
  const items = sortSavingsPresentationItems(
    savings.map((saving) => buildSavingsPresentationItem(saving, today)),
  );
  const activeItems = items.filter(
    ({ maturityState }) => !isMaturitySettled(maturityState),
  );
  const historyItems = items.filter(({ maturityState }) =>
    isMaturitySettled(maturityState),
  );
  const bankItems = activeItems.filter(
    ({ saving }) => saving.savingsFamily === SavingsFamily.BANK,
  );
  const platformItems = activeItems.filter(
    ({ saving }) => saving.savingsFamily === "PLATFORM",
  );
  return {
    items,
    activeItems,
    historyItems,
    bankItems,
    platformItems,
    totalPrincipal: activeItems.reduce((sum, item) => sum + item.principal, 0),
    expectedGrossInterest: activeItems.reduce(
      (sum, item) => sum + item.grossInterest,
      0,
    ),
    expectedTax: activeItems.reduce((sum, item) => sum + item.tax, 0),
    expectedNetInterest: activeItems.reduce(
      (sum, item) => sum + item.netInterest,
      0,
    ),
    expectedTotalCashReceived: activeItems.reduce(
      (sum, item) => sum + item.totalCashReceived,
      0,
    ),
    attentionCount: activeItems.filter(({ maturityState }) =>
      isMaturityAttention(maturityState),
    ).length,
  };
}
