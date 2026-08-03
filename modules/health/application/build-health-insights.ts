/**
 * Light Health insights + scenarios from household facts only (ST-E07-002).
 * Never invents ledger balances (BR-01 / BR-14 / AC-017).
 */

export const InsightKind = {
  EMI_COMPLETE: "emi_complete",
  SETUP: "setup",
  INBOX: "inbox",
  ACTIVITY: "activity",
  PLAN: "plan",
  AI_GUARDRAIL: "ai_guardrail",
} as const;

export type InsightKind = (typeof InsightKind)[keyof typeof InsightKind];

export const ScenarioKind = {
  CLEAR_INBOX: "clear_inbox",
  ADD_JAR: "add_jar",
  KEEP_RHYTHM: "keep_rhythm",
} as const;

export type ScenarioKind = (typeof ScenarioKind)[keyof typeof ScenarioKind];

export type HealthInsight = {
  kind: InsightKind;
  /** ICU params for message catalogs — counts only, never invented amounts. */
  params: Record<string, number>;
};

export type HealthScenario = {
  kind: ScenarioKind;
  params: Record<string, number>;
};

export type BuildHealthInsightsInput = {
  accountCount: number;
  activeJarCount: number;
  openInboxCount: number;
  recentTransactionCount: number;
  hasEmiCompletePending: boolean;
};

export type BuiltHealthInsights = {
  insights: HealthInsight[];
  scenarios: HealthScenario[];
};

/**
 * Deterministic insight/scenario list for Health screens.
 */
export function buildHealthInsights(
  input: BuildHealthInsightsInput,
): BuiltHealthInsights {
  const insights: HealthInsight[] = [];

  if (input.hasEmiCompletePending) {
    insights.push({ kind: InsightKind.EMI_COMPLETE, params: {} });
  }

  if (input.accountCount === 0 || input.activeJarCount === 0) {
    insights.push({
      kind: InsightKind.SETUP,
      params: {
        accountCount: input.accountCount,
        jarCount: input.activeJarCount,
      },
    });
  }

  if (input.openInboxCount > 0) {
    insights.push({
      kind: InsightKind.INBOX,
      params: { count: input.openInboxCount },
    });
  }

  insights.push({
    kind: InsightKind.ACTIVITY,
    params: { count: input.recentTransactionCount },
  });

  if (input.activeJarCount > 0) {
    insights.push({
      kind: InsightKind.PLAN,
      params: { count: input.activeJarCount },
    });
  }

  // Always last — Phase 2 AI must not invent balances (AC-017 / BR-14).
  insights.push({ kind: InsightKind.AI_GUARDRAIL, params: {} });

  const scenarios: HealthScenario[] = [];

  if (input.openInboxCount > 0) {
    scenarios.push({
      kind: ScenarioKind.CLEAR_INBOX,
      params: { count: input.openInboxCount },
    });
  }

  if (input.activeJarCount === 0) {
    scenarios.push({ kind: ScenarioKind.ADD_JAR, params: {} });
  }

  scenarios.push({
    kind: ScenarioKind.KEEP_RHYTHM,
    params: {},
  });

  return { insights, scenarios };
}
