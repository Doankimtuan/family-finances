import { getRealPosition } from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  computeHealthPulse,
  type HealthPulse,
} from "@/modules/health/application/health-pulse";

export type HomeDashboard = {
  currency: string;
  realBalance: number;
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
  incomeAllocateMode: "off" | "suggest" | "auto";
  health: HealthPulse;
  isDayZero: boolean;
};

/**
 * Home three answers + Health chip read model (AC-001 / AC-015 / BR-01).
 */
export async function getHomeDashboard(): Promise<HomeDashboard | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  const [position, pulse, inbox] = await Promise.all([
    getRealPosition(),
    getPlanPulse(),
    listOpenInboxItems(),
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
  };
}
