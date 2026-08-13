import {
  getRealPosition,
  listTransactionsForDateRange,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  computeHealthPulse,
  type HealthPulse,
} from "@/modules/health/application/health-pulse";
import {
  HOME_DASHBOARD_DEFAULT_PERIOD,
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
  financialMetrics: HomeFinancialMetrics | null;
};

/**
 * Home read model. The top-level position, Plan, and Inbox are core data;
 * transactional analytics degrade independently when that bounded source fails.
 */
export async function getHomeDashboard(
  period: HomeDashboardPeriod = HOME_DASHBOARD_DEFAULT_PERIOD,
): Promise<HomeDashboard | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }
  const dateRange = getHomeDashboardDateRange(period);
  const [position, pulse, inbox, transactions] = await Promise.all([
    getRealPosition(),
    getPlanPulse(),
    listOpenInboxItems(),
    listTransactionsForDateRange(
      homeDashboardQueryStart(dateRange),
      homeDashboardQueryEnd(dateRange),
    ),
  ]);
  if (position == null || pulse == null || inbox == null) {
    return null;
  }
  const accountCount = position.accounts.length;
  const activeJarCount = pulse.activeJars.length;
  const openInboxCount = inbox.length;
  const health = computeHealthPulse({
    accountCount,
    activeJarCount,
    openInboxCount,
  });
  return {
    currency: position.currency,
    realBalance: position.totalBalance,
    accountCount,
    activeJarCount,
    openInboxCount,
    incomeAllocateMode: pulse.incomeAllocateMode,
    health,
    isDayZero: accountCount === 0 && activeJarCount === 0,
    period,
    dateRange,
    financialMetrics:
      transactions == null
        ? null
        : calculateHomeFinancialMetrics({ transactions, range: dateRange }),
  };
}
