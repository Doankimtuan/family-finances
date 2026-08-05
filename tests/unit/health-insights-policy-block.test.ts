import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/platform/application/ai-policy", () => ({
  AI_POLICY_ERROR_CODE: {
    INVENTED_AMOUNT: "invented_amount",
    AUTONOMOUS_MONEY_MOVE: "autonomous_money_move",
    UNGROUNDED_PARAMS: "ungrounded_params",
  },
  assertAiSuggestionGrounded: vi.fn(() => ({
    ok: false,
    code: "ungrounded_params",
  })),
}));

import { assertAiSuggestionGrounded } from "@/modules/platform/application/ai-policy";
import {
  buildHealthInsights,
  InsightKind,
} from "@/modules/health/application/build-health-insights";

describe("buildHealthInsights policy block hook (ST-E06-002 / B3)", () => {
  it("invokes onPolicyBlock when grounding rejects params", () => {
    const onPolicyBlock = vi.fn();

    const built = buildHealthInsights({
      accountCount: 1,
      activeJarCount: 1,
      openInboxCount: 0,
      recentTransactionCount: 1,
      hasEmiCompletePending: false,
      onPolicyBlock,
    });

    expect(assertAiSuggestionGrounded).toHaveBeenCalled();
    expect(onPolicyBlock).toHaveBeenCalled();
    expect(built.insights.at(-1)?.kind).toBe(InsightKind.AI_GUARDRAIL);
    expect(built.insights.at(-1)?.params).toEqual({});
  });
});
