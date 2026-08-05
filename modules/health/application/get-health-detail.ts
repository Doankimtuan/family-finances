import "server-only";

import {
  getRealPosition,
  listRecentTransactions,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems, InboxItemKind } from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  computeHealthPulse,
  type HealthPulse,
} from "@/modules/health/application/health-pulse";
import {
  buildHealthInsights,
  type HealthInsight,
  type HealthScenario,
} from "@/modules/health/application/build-health-insights";
import { logHealthAiPolicyBlock } from "@/modules/health/application/log-health-ai-policy-block";

export type HealthDetail = {
  health: HealthPulse;
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
  recentTransactionCount: number;
  hasEmiCompletePending: boolean;
  insights: HealthInsight[];
  scenarios: HealthScenario[];
};

/**
 * Health overview + light insights (AC-015 / AC-011 / AC-017).
 * Facts only from ledger / plan / inbox — no invented balances (BR-14).
 */
export async function getHealthDetail(): Promise<HealthDetail | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  const [position, pulse, inbox, recent] = await Promise.all([
    getRealPosition(),
    getPlanPulse(),
    listOpenInboxItems(),
    listRecentTransactions(8),
  ]);

  if (position == null || pulse == null || inbox == null || recent == null) {
    return null;
  }

  const accountCount = position.accounts.length;
  const activeJarCount = pulse.activeJars.length;
  const openInboxCount = inbox.length;
  const recentTransactionCount = recent.length;
  const hasEmiCompletePending = inbox.some(
    (item) => item.kind === InboxItemKind.EMI_COMPLETE,
  );
  const health = computeHealthPulse({
    accountCount,
    activeJarCount,
    openInboxCount,
  });
  const built = buildHealthInsights({
    accountCount,
    activeJarCount,
    openInboxCount,
    recentTransactionCount,
    hasEmiCompletePending,
    onPolicyBlock: (block) => {
      void logHealthAiPolicyBlock(block);
    },
  });

  return {
    health,
    accountCount,
    activeJarCount,
    openInboxCount,
    recentTransactionCount,
    hasEmiCompletePending,
    insights: built.insights,
    scenarios: built.scenarios,
  };
}
