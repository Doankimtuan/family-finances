import {
  HomeCashFlowGranularity,
  HomeDashboardPeriod,
  HOME_CASH_FLOW_GRANULARITY_BY_PERIOD,
  HOME_CASH_FLOW_WEEK_LENGTH_DAYS,
  HOME_DASHBOARD_MAX_CATEGORY_COUNT,
  HOME_PERCENT_SCALE,
  type HomeCashFlowGranularity as HomeCashFlowGranularityValue,
  type HomeDashboardPeriod as HomeDashboardPeriodValue,
} from "./home-constants";
import {
  type LedgerTransaction,
} from "@/modules/ledger/application";
import {
  countsTowardMonthlyExpense,
  countsTowardMonthlyIncome,
  sumMonthlyExpense,
  sumMonthlyIncome,
} from "@/modules/ledger/application/income-exclusion-policy";

export type HomeDashboardDateRange = {
  period: HomeDashboardPeriodValue;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
};
export type HomePeriodComparison = {
  amount: number;
  ratio: number;
};

export type HomeCashFlowTrendPoint = {
  key: string;
  startDate: string;
  endDate: string;
  income: number;
  expense: number;
};

export type HomeCashFlowTrend = {
  granularity: HomeCashFlowGranularityValue;
  points: HomeCashFlowTrendPoint[];
  activePointCount: number;
};

export type HomeSpendingCategory = {
  id: string | null;
  name: string | null;
  amount: number;
  proportion: number;
  progressPercent: number;
};

export type HomeSpendingInsight = {
  kind: "higher" | "lower";
  amount: number;
} | null;

export type HomeFinancialMetrics = {
  income: number;
  expense: number;
  netCashFlow: number;
  previousIncome: number;
  previousExpense: number;
  previousNetCashFlow: number;
  netCashFlowComparison: HomePeriodComparison | null;
  expenseComparison: HomePeriodComparison | null;
  trend: HomeCashFlowTrend;
  spendingCategories: HomeSpendingCategory[];
  spendingInsight: HomeSpendingInsight;
  hasTransactions: boolean;
};
function toUtcDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcQuarter(date: Date): Date {
  const month = date.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}
function previousPeriodStart(
  period: HomeDashboardPeriodValue,
  start: Date,
): Date {
  const monthOffset = period === HomeDashboardPeriod.QUARTER ? 3 : 1;
  return new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - monthOffset, 1),
  );
}
/**
 * Current period always ends today. The comparison period matches the elapsed
 * number of calendar days, avoiding a misleading partial-month / full-month
 * comparison.
 */
export function getHomeDashboardDateRange(
  period: HomeDashboardPeriodValue,
  now = new Date(),
): HomeDashboardDateRange {
  const end = startOfUtcDay(now);
  const start =
    period === HomeDashboardPeriod.QUARTER
      ? startOfUtcQuarter(end)
      : startOfUtcMonth(end);
  const previousStart = previousPeriodStart(period, start);
  const elapsedDays = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  const previousPeriodEndBoundary =
    period === HomeDashboardPeriod.QUARTER
      ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 0))
      : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 0));
  const previousEndCandidate = addUtcDays(previousStart, elapsedDays);
  const previousEnd =
    previousEndCandidate.getTime() > previousPeriodEndBoundary.getTime()
      ? previousPeriodEndBoundary
      : previousEndCandidate;

  return {
    period,
    startDate: toUtcDateString(start),
    endDate: toUtcDateString(end),
    previousStartDate: toUtcDateString(previousStart),
    previousEndDate: toUtcDateString(previousEnd),
  };
}

export function homeDashboardQueryStart(range: HomeDashboardDateRange): string {
  return range.previousStartDate;
}

export function homeDashboardQueryEnd(range: HomeDashboardDateRange): string {
  return range.endDate;
}

function fallsWithin(
  transactionDate: string,
  startDate: string,
  endDate: string,
): boolean {
  return transactionDate >= startDate && transactionDate <= endDate;
}

/** Return a comparison only when a positive, meaningful baseline exists. */
export function calculatePeriodComparison(
  currentValue: number,
  previousValue: number,
): HomePeriodComparison | null {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) {
    return null;
  }
  if (previousValue <= 0) return null;
  return {
    amount: currentValue - previousValue,
    ratio: (currentValue - previousValue) / previousValue,
  };
}

function hasReportableCashFlow(transactions: LedgerTransaction[]): boolean {
  return transactions.some(
    (transaction) =>
      countsTowardMonthlyIncome(transaction) ||
      countsTowardMonthlyExpense(transaction),
  );
}

function buildDailyTrend(
  transactions: LedgerTransaction[],
  range: HomeDashboardDateRange,
): HomeCashFlowTrendPoint[] {
  const transactionsByDate = new Map<string, LedgerTransaction[]>();
  for (const transaction of transactions) {
    const dateTransactions =
      transactionsByDate.get(transaction.transactionDate) ?? [];
    dateTransactions.push(transaction);
    transactionsByDate.set(transaction.transactionDate, dateTransactions);
  }

  const points: HomeCashFlowTrendPoint[] = [];
  const start = new Date(`${range.startDate}T00:00:00.000Z`);
  const end = new Date(`${range.endDate}T00:00:00.000Z`);
  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    const date = toUtcDateString(cursor);
    const dateTransactions = transactionsByDate.get(date) ?? [];
    points.push({
      key: date,
      startDate: date,
      endDate: date,
      income: sumMonthlyIncome(dateTransactions),
      expense: sumMonthlyExpense(dateTransactions),
    });
  }
  return points;
}

function aggregateCashFlowTrend(
  points: HomeCashFlowTrendPoint[],
  granularity: HomeCashFlowGranularityValue,
): HomeCashFlowTrendPoint[] {
  if (granularity === HomeCashFlowGranularity.DAY) return points;

  const groupedPoints: HomeCashFlowTrendPoint[] = [];
  for (
    let startIndex = 0;
    startIndex < points.length;
    startIndex += HOME_CASH_FLOW_WEEK_LENGTH_DAYS
  ) {
    const bucket = points.slice(
      startIndex,
      startIndex + HOME_CASH_FLOW_WEEK_LENGTH_DAYS,
    );
    const first = bucket[0];
    const last = bucket.at(-1);
    if (!first || !last) continue;
    groupedPoints.push({
      key: first.key,
      startDate: first.startDate,
      endDate: last.endDate,
      income: bucket.reduce((sum, point) => sum + point.income, 0),
      expense: bucket.reduce((sum, point) => sum + point.expense, 0),
    });
  }
  return groupedPoints;
}

function buildTrend(
  transactions: LedgerTransaction[],
  range: HomeDashboardDateRange,
): HomeCashFlowTrend {
  const granularity = HOME_CASH_FLOW_GRANULARITY_BY_PERIOD[range.period];
  const points = aggregateCashFlowTrend(
    buildDailyTrend(transactions, range),
    granularity,
  );
  return {
    granularity,
    points,
    activePointCount: points.filter(
      (point) => point.income > 0 || point.expense > 0,
    ).length,
  };
}

function buildSpendingCategories(
  transactions: LedgerTransaction[],
  totalExpense: number,
): HomeSpendingCategory[] {
  const categories = new Map<
    string,
    { id: string | null; name: string | null; amount: number }
  >();
  for (const transaction of transactions) {
    if (!countsTowardMonthlyExpense(transaction)) continue;
    const key = transaction.categoryId ?? "";
    const current = categories.get(key) ?? {
      id: transaction.categoryId,
      name: transaction.categoryName,
      amount: 0,
    };
    current.amount += transaction.amount;
    categories.set(key, current);
  }
  return Array.from(categories.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, HOME_DASHBOARD_MAX_CATEGORY_COUNT)
    .map((category) => {
      const proportion = totalExpense > 0 ? category.amount / totalExpense : 0;
      return {
        ...category,
        proportion,
        progressPercent: Math.round(proportion * HOME_PERCENT_SCALE),
      };
    });
}

export function calculateHomeFinancialMetrics(input: {
  transactions: LedgerTransaction[];
  range: HomeDashboardDateRange;
}): HomeFinancialMetrics {
  const currentTransactions = input.transactions.filter((transaction) =>
    fallsWithin(
      transaction.transactionDate,
      input.range.startDate,
      input.range.endDate,
    ),
  );
  const previousTransactions = input.transactions.filter((transaction) =>
    fallsWithin(
      transaction.transactionDate,
      input.range.previousStartDate,
      input.range.previousEndDate,
    ),
  );
  const income = sumMonthlyIncome(currentTransactions);
  const expense = sumMonthlyExpense(currentTransactions);
  const previousIncome = sumMonthlyIncome(previousTransactions);
  const previousExpense = sumMonthlyExpense(previousTransactions);
  const netCashFlow = income - expense;
  const previousNetCashFlow = previousIncome - previousExpense;
  const expenseComparison = calculatePeriodComparison(expense, previousExpense);

  return {
    income,
    expense,
    netCashFlow,
    previousIncome,
    previousExpense,
    previousNetCashFlow,
    netCashFlowComparison: calculatePeriodComparison(
      netCashFlow,
      previousNetCashFlow,
    ),
    expenseComparison,
    trend: buildTrend(currentTransactions, input.range),
    spendingCategories: buildSpendingCategories(currentTransactions, expense),
    spendingInsight:
      expenseComparison && expenseComparison.amount !== 0
        ? {
            kind: expenseComparison.amount > 0 ? "higher" : "lower",
            amount: Math.abs(expenseComparison.amount),
          }
        : null,
    hasTransactions: hasReportableCashFlow(currentTransactions),
  };
}
