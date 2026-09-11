import { cache } from "react";
import {
  getRealPosition,
  listTransactionsForDateRange,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { getOpenInboxAttention } from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import type { IncomeAllocateMode } from "@/modules/tenancy/application/household-policy-constants";
import {
  computeHealthPulse,
  type HealthPulse,
} from "@/modules/health/application/health-pulse";
import {
  HOME_DASHBOARD_DEFAULT_PERIOD,
  HomeDashboardFailureSource,
  HomeDashboardReadStatus,
  type HomeDashboardPeriod,
} from "./home-constants";
import {
  calculateHomeFinancialMetrics,
  getHomeDashboardDateRange,
  homeDashboardQueryEnd,
  homeDashboardQueryStart,
  type HomeDashboardDateRange,
  type HomeFinancialMetrics,
} from "./home-dashboard-metrics";

export type HomeReadiness = {
  currency: string;
  realBalance: number;
  accountCount: number;
  activeJarCount: number;
  incomeAllocateMode: IncomeAllocateMode;
  isDayZero: boolean;
};

export type HomeReadinessReadResult =
  | {
      status: typeof HomeDashboardReadStatus.ERROR;
      source:
        | typeof HomeDashboardFailureSource.ACCESS
        | typeof HomeDashboardFailureSource.PLAN
        | typeof HomeDashboardFailureSource.POSITION;
    }
  | {
      status: typeof HomeDashboardReadStatus.READY;
      readiness: HomeReadiness;
    };

export type HomePeriodData = {
  period: HomeDashboardPeriod;
  dateRange: HomeDashboardDateRange;
  financialMetrics: HomeFinancialMetrics | null;
};

type HomePeriodReadyData = Omit<HomePeriodData, "financialMetrics"> & {
  financialMetrics: HomeFinancialMetrics;
};

export type HomePeriodReadResult =
  | {
      status: typeof HomeDashboardReadStatus.ERROR;
      source: typeof HomeDashboardFailureSource.ACCESS;
    }
  | {
      status: typeof HomeDashboardReadStatus.PARTIAL;
      data: HomePeriodData;
    }
  | {
      status: typeof HomeDashboardReadStatus.READY;
      data: HomePeriodReadyData;
    };

export type HomeDashboard = {
  currency: string;
  realBalance: number;
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
  incomeAllocateMode: IncomeAllocateMode;
  health: HealthPulse;
  isDayZero: boolean;
  period: HomeDashboardPeriod;
  dateRange: HomeDashboardDateRange;
  financialMetrics: HomeFinancialMetrics;
  canReviewUncategorized: boolean;
};

export type HomeDashboardReadResult =
  | {
      status: typeof HomeDashboardReadStatus.ERROR;
      source: HomeDashboardFailureSource;
    }
  | {
      status: typeof HomeDashboardReadStatus.PARTIAL;
      dashboard: Omit<HomeDashboard, "financialMetrics"> & {
        financialMetrics: null;
      };
    }
  | {
      status: typeof HomeDashboardReadStatus.READY;
      dashboard: HomeDashboard;
    };

async function loadHomeReadiness(): Promise<HomeReadinessReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.ACCESS,
    };
  }

  const [position, pulse] = await Promise.all([
    getRealPosition(),
    getPlanPulse(),
  ]);
  if (position == null) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.POSITION,
    };
  }
  if (pulse == null) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.PLAN,
    };
  }

  const accountCount = position.accounts.length;
  const activeJarCount = pulse.activeJars.length;
  return {
    status: HomeDashboardReadStatus.READY,
    readiness: {
      currency: position.currency,
      realBalance: position.totalBalance,
      accountCount,
      activeJarCount,
      incomeAllocateMode: pulse.incomeAllocateMode,
      isDayZero: accountCount === 0 && activeJarCount === 0,
    },
  };
}

export const getHomeReadiness = cache(loadHomeReadiness);

async function loadHomePeriodData(
  period: HomeDashboardPeriod,
): Promise<HomePeriodReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.ACCESS,
    };
  }

  const dateRange = getHomeDashboardDateRange(period);
  const transactions = await listTransactionsForDateRange(
    homeDashboardQueryStart(dateRange),
    homeDashboardQueryEnd(dateRange),
  );
  if (transactions == null) {
    return {
      status: HomeDashboardReadStatus.PARTIAL,
      data: {
        period,
        dateRange,
        financialMetrics: null,
      },
    };
  }

  return {
    status: HomeDashboardReadStatus.READY,
    data: {
      period,
      dateRange,
      financialMetrics: calculateHomeFinancialMetrics({
        transactions,
        range: dateRange,
      }),
    },
  };
}

export const getHomePeriodData = cache(loadHomePeriodData);

/**
 * Home read model. The top-level position, Plan, and Inbox are core data;
 * transactional analytics degrade independently when that bounded source fails.
 */
export async function getHomeDashboard(
  period: HomeDashboardPeriod = HOME_DASHBOARD_DEFAULT_PERIOD,
): Promise<HomeDashboardReadResult> {
  const readiness = await getHomeReadiness();
  if (readiness.status === HomeDashboardReadStatus.ERROR) return readiness;

  const [inbox, periodData] = await Promise.all([
    getOpenInboxAttention(),
    getHomePeriodData(period),
  ]);
  if (inbox == null) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.INBOX,
    };
  }
  if (periodData.status === HomeDashboardReadStatus.ERROR) return periodData;

  const { readiness: ready } = readiness;
  const dashboardBase = {
    currency: ready.currency,
    realBalance: ready.realBalance,
    accountCount: ready.accountCount,
    activeJarCount: ready.activeJarCount,
    openInboxCount: inbox.openCount,
    incomeAllocateMode: ready.incomeAllocateMode,
    canReviewUncategorized: inbox.canReviewUncategorized,
    health: computeHealthPulse({
      accountCount: ready.accountCount,
      activeJarCount: ready.activeJarCount,
      openInboxCount: inbox.openCount,
    }),
    isDayZero: ready.isDayZero,
    period: periodData.data.period,
    dateRange: periodData.data.dateRange,
  };

  if (periodData.status === HomeDashboardReadStatus.PARTIAL) {
    return {
      status: HomeDashboardReadStatus.PARTIAL,
      dashboard: { ...dashboardBase, financialMetrics: null },
    };
  }
  return {
    status: HomeDashboardReadStatus.READY,
    dashboard: {
      ...dashboardBase,
      financialMetrics: periodData.data.financialMetrics,
    },
  };
}
