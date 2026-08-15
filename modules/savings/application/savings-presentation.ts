import {
  CycleStatus,
  MATURING_SOON_THRESHOLD_DAYS,
  SavingStatus,
  SavingsMaturityState,
} from "./savings-constants";
import {
  calculateSettlementBreakdown,
  EarlySettlementRule,
  SavingsTaxRule,
} from "./savings-domain-rules";
import type { Saving } from "./savings-types";

export const MaturityPresentationState = SavingsMaturityState;
export type MaturityPresentationState = SavingsMaturityState;

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

function toUtcDay(value: string | Date): Date {
  const raw = typeof value === "string" ? value : value.toISOString();
  return new Date(`${raw.slice(0, 10)}T00:00:00Z`);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDifference(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function deriveMaturityPresentationState(
  saving: Saving,
  today = todayIso(),
): MaturityPresentationState {
  if (saving.status === SavingStatus.CLOSED)
    return MaturityPresentationState.SETTLED;
  if (saving.status === SavingStatus.EARLY_CLOSED)
    return MaturityPresentationState.EARLY_SETTLED;
  if (saving.maturityActionRequired)
    return MaturityPresentationState.ACTION_REQUIRED;
  const cycle = saving.latestCycle;
  if (!cycle) return MaturityPresentationState.ACTIVE;
  if (
    cycle.status === CycleStatus.MATURED ||
    saving.status === SavingStatus.MATURED
  ) {
    const days = dayDifference(toUtcDay(today), toUtcDay(cycle.endDate));
    return days === 0
      ? MaturityPresentationState.MATURE_TODAY
      : MaturityPresentationState.MATURED;
  }
  const daysUntilMaturity = dayDifference(
    toUtcDay(today),
    toUtcDay(cycle.endDate),
  );
  if (
    daysUntilMaturity >= 0 &&
    daysUntilMaturity <= MATURING_SOON_THRESHOLD_DAYS
  ) {
    return MaturityPresentationState.MATURING_SOON;
  }
  return MaturityPresentationState.ACTIVE;
}

export function maturityDaysRemaining(
  saving: Saving,
  today = todayIso(),
): number | null {
  const endDate = saving.latestCycle?.endDate;
  if (!endDate) return null;
  return dayDifference(toUtcDay(today), toUtcDay(endDate));
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
  today = todayIso(),
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
        dayDifference(toUtcDay(cycle.startDate), toUtcDay(cycle.endDate)),
      )
    : 0;
  const elapsedDays = cycle
    ? Math.max(0, dayDifference(toUtcDay(cycle.startDate), toUtcDay(today)))
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
  today = todayIso(),
): SavingsDetailModel {
  const base = buildSavingsPresentationItem(saving, today);
  const cycle = saving.latestCycle;
  const totalTermDays = cycle
    ? Math.max(
        0,
        dayDifference(toUtcDay(cycle.startDate), toUtcDay(cycle.endDate)),
      )
    : null;
  const elapsedDays = cycle
    ? Math.max(0, dayDifference(toUtcDay(cycle.startDate), toUtcDay(today)))
    : null;
  const isTerminal =
    base.maturityState === MaturityPresentationState.SETTLED ||
    base.maturityState === MaturityPresentationState.EARLY_SETTLED;
  const earlyRule = saving.productSnapshot.earlySettlementRule;
  return {
    ...base,
    elapsedDays,
    totalTermDays,
    canSettle:
      base.maturityState === MaturityPresentationState.MATURED ||
      base.maturityState === MaturityPresentationState.MATURE_TODAY ||
      base.maturityState === MaturityPresentationState.ACTION_REQUIRED,
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
  today = todayIso(),
): SavingsOverviewModel {
  const items = sortSavingsPresentationItems(
    savings.map((saving) => buildSavingsPresentationItem(saving, today)),
  );
  const activeItems = items.filter(
    ({ maturityState }) =>
      maturityState !== MaturityPresentationState.SETTLED &&
      maturityState !== MaturityPresentationState.EARLY_SETTLED,
  );
  const historyItems = items.filter(
    ({ maturityState }) =>
      maturityState === MaturityPresentationState.SETTLED ||
      maturityState === MaturityPresentationState.EARLY_SETTLED,
  );
  const bankItems = activeItems.filter(
    ({ saving }) => saving.savingsFamily === "BANK",
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
    attentionCount: activeItems.filter(
      ({ maturityState }) =>
        maturityState === MaturityPresentationState.MATURED ||
        maturityState === MaturityPresentationState.MATURE_TODAY ||
        maturityState === MaturityPresentationState.ACTION_REQUIRED,
    ).length,
  };
}
