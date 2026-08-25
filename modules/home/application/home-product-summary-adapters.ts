import {
  getDebtDueState,
  listDebts,
  DebtDirection,
  DebtDueState,
  DebtStatus,
} from "@/modules/ledger/application";
import { listLoanSummaries, LoanStatus } from "@/modules/ledger/application";
import { LoanDueState } from "@/modules/ledger/application/loan-constants";
import { getLoanDueState } from "@/modules/ledger/application/loan-due-state";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { listInvestmentHomeSummary } from "@/modules/investments/application";
import { getSavingsHomeSummary } from "@/modules/savings/application";
import { HomeProductReadStatus } from "./home-constants";

export type HomeProductReadResult<T> =
  | { status: typeof HomeProductReadStatus.READY; summary: T }
  | { status: typeof HomeProductReadStatus.UNAVAILABLE };

export type HomeSavingsSummary = {
  activeCount: number;
  principal: number;
  actionRequiredCount: number;
  nearestMaturityDate: string | null;
};

export type HomeInvestmentSummary = {
  activeCount: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  income: number;
  valuationQuality: "current" | "stale" | "manual" | "partial" | "unknown";
  valuationStale: boolean;
  valuationIncluded: number;
  valuationTotal: number;
};

export type HomeLoanSummary = {
  activeCount: number;
  remainingPrincipal: number;
  attentionCount: number;
  nearestDueDate: string | null;
  overdueCount: number;
};

export type HomeDebtSummary = {
  activeCount: number;
  borrowedRemaining: number;
  lentRemaining: number;
  attentionCount: number;
  nearestDueDate: string | null;
  overdueCount: number;
};

function nearestDate(dates: Array<string | null>) {
  return dates.filter((date): date is string => date != null).sort()[0] ?? null;
}

export async function getHomeSavingsSummary(): Promise<
  HomeProductReadResult<HomeSavingsSummary>
> {
  const savings = await getSavingsHomeSummary();
  if (!savings) return { status: HomeProductReadStatus.UNAVAILABLE };
  return {
    status: HomeProductReadStatus.READY,
    summary: {
      activeCount: savings.activeCount,
      principal: savings.principal,
      actionRequiredCount: savings.actionRequiredCount,
      nearestMaturityDate: savings.nearestMaturityDate,
    },
  };
}

export async function getHomeInvestmentSummary(
  forceUnavailable = false,
): Promise<HomeProductReadResult<HomeInvestmentSummary>> {
  if (forceUnavailable) return { status: HomeProductReadStatus.UNAVAILABLE };
  const portfolio = await listInvestmentHomeSummary();
  if (!portfolio) return { status: HomeProductReadStatus.UNAVAILABLE };
  return {
    status: HomeProductReadStatus.READY,
    summary: {
      activeCount: portfolio.activeCount,
      marketValue: portfolio.marketValue,
      unrealizedPnl: portfolio.unrealizedPnl,
      realizedPnl: portfolio.realizedPnl,
      income: portfolio.income,
      valuationQuality: portfolio.valuationQuality,
      valuationStale: portfolio.valuationStale,
      valuationIncluded: portfolio.valuationIncluded,
      valuationTotal: portfolio.valuationTotal,
    },
  };
}

export async function getHomeLoanSummary(): Promise<
  HomeProductReadResult<HomeLoanSummary>
> {
  const loans = await listLoanSummaries();
  if (!loans) return { status: HomeProductReadStatus.UNAVAILABLE };
  const active = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
  const today = todayIsoDate();
  const dueStates = active.map((loan) =>
    getLoanDueState(loan.nextPaymentDate, today),
  );
  return {
    status: HomeProductReadStatus.READY,
    summary: {
      activeCount: active.length,
      remainingPrincipal: active.reduce(
        (sum, loan) => sum + loan.remainingPrincipal,
        0,
      ),
      attentionCount: dueStates.filter(
        (state) =>
          state === LoanDueState.OVERDUE ||
          state === LoanDueState.DUE_TODAY ||
          state === LoanDueState.DUE_SOON,
      ).length,
      nearestDueDate: nearestDate(active.map((loan) => loan.nextPaymentDate)),
      overdueCount: dueStates.filter((state) => state === LoanDueState.OVERDUE)
        .length,
    },
  };
}

export async function getHomeDebtSummary(): Promise<
  HomeProductReadResult<HomeDebtSummary>
> {
  const debts = await listDebts();
  if (!debts) return { status: HomeProductReadStatus.UNAVAILABLE };
  const active = debts.filter((debt) => debt.status === DebtStatus.ACTIVE);
  const today = todayIsoDate();
  const dueStates = active.map((debt) => getDebtDueState(debt, today));
  return {
    status: HomeProductReadStatus.READY,
    summary: {
      activeCount: active.length,
      borrowedRemaining: active
        .filter((debt) => debt.direction === DebtDirection.BORROWED)
        .reduce((sum, debt) => sum + debt.remainingAmount, 0),
      lentRemaining: active
        .filter((debt) => debt.direction === DebtDirection.LENT)
        .reduce((sum, debt) => sum + debt.remainingAmount, 0),
      attentionCount: dueStates.filter(
        (state) =>
          state === DebtDueState.OVERDUE ||
          state === DebtDueState.DUE_TODAY ||
          state === DebtDueState.DUE_SOON,
      ).length,
      nearestDueDate: nearestDate(active.map((debt) => debt.dueDate)),
      overdueCount: dueStates.filter((state) => state === DebtDueState.OVERDUE)
        .length,
    },
  };
}
