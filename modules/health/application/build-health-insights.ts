/**
 * Light Health insights + scenarios from household facts only (ST-E07-002 / ST-E06-002).
 * Never invents ledger balances (BR-01 / BR-14 / AC-017 / AC-HLT-01).
 */

import {
  assertAiSuggestionGrounded,
  type AiPolicyErrorCode,
} from "@/modules/platform/application/ai-policy";
import {
  HealthSourceKind,
  type HealthSourceKind as HealthSourceKindValue,
} from "./health-constants";

export type HealthPolicyBlock = {
  target: "insight" | "scenario";
  kind: string;
  code: AiPolicyErrorCode;
};

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
  source: HealthSourceKindValue | null;
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
  /** BR-14: optional audit hook when grounding rejects params. */
  onPolicyBlock?: (block: HealthPolicyBlock) => void;
};

export type BuiltHealthInsights = {
  insights: HealthInsight[];
  scenarios: HealthScenario[];
};

function groundedInsight(
  kind: InsightKind,
  params: Record<string, number>,
  source: HealthSourceKindValue | null,
  onPolicyBlock?: (block: HealthPolicyBlock) => void,
): HealthInsight {
  const gate = assertAiSuggestionGrounded({
    countsOnly: true,
    params,
  });
  if (!gate.ok) {
    onPolicyBlock?.({ target: "insight", kind, code: gate.code });
    return { kind, params: {}, source: null };
  }
  return { kind, params, source };
}

/**
 * Deterministic insight/scenario list for Health screens.
 */
export function buildHealthInsights(
  input: BuildHealthInsightsInput,
): BuiltHealthInsights {
  const onPolicyBlock = input.onPolicyBlock;
  const insights: HealthInsight[] = [];

  if (input.hasEmiCompletePending) {
    insights.push(
      groundedInsight(
        InsightKind.EMI_COMPLETE,
        {},
        HealthSourceKind.INBOX,
        onPolicyBlock,
      ),
    );
  }

  if (input.accountCount === 0 || input.activeJarCount === 0) {
    insights.push(
      groundedInsight(
        InsightKind.SETUP,
        {
          accountCount: input.accountCount,
          jarCount: input.activeJarCount,
        },
        input.accountCount === 0
          ? HealthSourceKind.ACCOUNTS
          : HealthSourceKind.PLAN_JARS,
        onPolicyBlock,
      ),
    );
  }

  if (input.openInboxCount > 0) {
    insights.push(
      groundedInsight(
        InsightKind.INBOX,
        { count: input.openInboxCount },
        HealthSourceKind.INBOX,
        onPolicyBlock,
      ),
    );
  }

  insights.push(
    groundedInsight(
      InsightKind.ACTIVITY,
      {
        count: input.recentTransactionCount,
      },
      HealthSourceKind.TRANSACTIONS,
      onPolicyBlock,
    ),
  );

  if (input.activeJarCount > 0) {
    insights.push(
      groundedInsight(
        InsightKind.PLAN,
        { count: input.activeJarCount },
        HealthSourceKind.PLAN_JARS,
        onPolicyBlock,
      ),
    );
  }

  // Always last — Phase 2 AI must not invent balances (AC-017 / BR-14).
  insights.push(
    groundedInsight(InsightKind.AI_GUARDRAIL, {}, null, onPolicyBlock),
  );

  const scenarios: HealthScenario[] = [];

  if (input.openInboxCount > 0) {
    const params = { count: input.openInboxCount };
    const gate = assertAiSuggestionGrounded({ countsOnly: true, params });
    if (!gate.ok) {
      onPolicyBlock?.({
        target: "scenario",
        kind: ScenarioKind.CLEAR_INBOX,
        code: gate.code,
      });
    }
    scenarios.push({
      kind: ScenarioKind.CLEAR_INBOX,
      params: gate.ok ? params : {},
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
