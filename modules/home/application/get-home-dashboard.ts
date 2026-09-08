import {
  getRealPosition,
  listTransactionsForDateRange,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { getOpenInboxAttention } from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
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

export type HomeDashboard = {
  currency: string;
  realBalance: number;
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
  incomeAllocateMode: "off" | "suggest" | "auto";
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

/**
 * Home read model. The top-level position, Plan, and Inbox are core data;
 * transactional analytics degrade independently when that bounded source fails.
 */
export async function getHomeDashboard(
  period: HomeDashboardPeriod = HOME_DASHBOARD_DEFAULT_PERIOD,
): Promise<HomeDashboardReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.ACCESS,
    };
  }
  const dateRange = getHomeDashboardDateRange(period);
  const [position, pulse, inbox, transactions] = await Promise.all([
    getRealPosition(),
    getPlanPulse(),
    getOpenInboxAttention(),
    listTransactionsForDateRange(
      homeDashboardQueryStart(dateRange),
      homeDashboardQueryEnd(dateRange),
    ),
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
  if (inbox == null) {
    return {
      status: HomeDashboardReadStatus.ERROR,
      source: HomeDashboardFailureSource.INBOX,
    };
  }
  const accountCount = position.accounts.length;
  const activeJarCount = pulse.activeJars.length;
  const openInboxCount = inbox.openCount;
  const health = computeHealthPulse({
    accountCount,
    activeJarCount,
    openInboxCount,
  });
  const dashboardBase = {
    currency: position.currency,
    realBalance: position.totalBalance,
    accountCount,
    activeJarCount,
    openInboxCount,
    incomeAllocateMode: pulse.incomeAllocateMode,
    canReviewUncategorized: inbox.canReviewUncategorized,
    health,
    isDayZero: accountCount === 0 && activeJarCount === 0,
    period,
    dateRange,
  };

  if (transactions == null) {
    return {
      status: HomeDashboardReadStatus.PARTIAL,
      dashboard: { ...dashboardBase, financialMetrics: null },
    };
  }
  return {
    status: HomeDashboardReadStatus.READY,
    dashboard: {
      ...dashboardBase,
      financialMetrics: calculateHomeFinancialMetrics({
        transactions,
        range: dateRange,
      }),
    },
  };
}
