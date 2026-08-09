import "server-only";

import {
  getRealPosition,
  listRecentTransactions,
} from "@/modules/ledger/application";
import { getPlanPulse } from "@/modules/plan/application";
import { listOpenInboxItems, InboxItemKind } from "@/modules/inbox/application";
import {
  assessHealthPulse,
  type HealthPulse,
  type HealthCompleteness,
} from "@/modules/health/application/health-pulse";
import type { HealthAssessmentState } from "./health-constants";
import {
  buildHealthInsights,
  type HealthInsight,
  type HealthScenario,
} from "@/modules/health/application/build-health-insights";
import { logHealthAiPolicyBlock } from "@/modules/health/application/log-health-ai-policy-block";

export type HealthDetail = {
  health: HealthPulse | null;
  state: HealthAssessmentState;
  completeness: HealthCompleteness;
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
  const assessment = assessHealthPulse({
    accountCount,
    activeJarCount,
    openInboxCount,
    recentTransactionCount,
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
    health: assessment.health,
    state: assessment.state,
    completeness: assessment.completeness,
    accountCount,
    activeJarCount,
    openInboxCount,
    recentTransactionCount,
    hasEmiCompletePending,
    insights: built.insights,
    scenarios: built.scenarios,
  };
}
