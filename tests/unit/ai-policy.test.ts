import { describe, expect, it } from "vitest";
import {
  assertAiSuggestionGrounded,
  assertNoAutonomousMoneyMove,
  AI_POLICY_ERROR_CODE,
} from "@/modules/platform/application/ai-policy";
import {
  AiAuditEventKind,
  recordAiAuditEventInputSchema,
} from "@/modules/tenancy/application/ai-audit.schema";

describe("AI Non-Invention policy (BR-14)", () => {
  it("accepts counts-only grounded params", () => {
    expect(
      assertAiSuggestionGrounded({
        countsOnly: true,
        params: { count: 3, jarCount: 1 },
      }),
    ).toEqual({ ok: true });
  });

  it("rejects non-numeric params in counts-only mode", () => {
    expect(
      assertAiSuggestionGrounded({
        countsOnly: true,
        params: { label: "fake balance" },
      }),
    ).toEqual({ ok: false, code: AI_POLICY_ERROR_CODE.UNGROUNDED_PARAMS });
  });

  it("rejects proposed amounts that are not in verified set", () => {
    expect(
      assertAiSuggestionGrounded({
        proposedAmounts: [1_000_000],
        verifiedAmounts: [500_000],
      }),
    ).toEqual({ ok: false, code: AI_POLICY_ERROR_CODE.INVENTED_AMOUNT });
  });

  it("accepts proposed amounts that match verified facts", () => {
    expect(
      assertAiSuggestionGrounded({
        proposedAmounts: [500_000],
        verifiedAmounts: [500_000, 200_000],
      }),
    ).toEqual({ ok: true });
  });

  it("blocks autonomous money moves without explicit approval", () => {
    expect(
      assertNoAutonomousMoneyMove({
        executesMoneyMove: true,
        userExplicitlyApproved: false,
      }),
    ).toEqual({
      ok: false,
      code: AI_POLICY_ERROR_CODE.AUTONOMOUS_MONEY_MOVE,
    });

    expect(
      assertNoAutonomousMoneyMove({
        executesMoneyMove: true,
        userExplicitlyApproved: true,
      }),
    ).toEqual({ ok: true });
  });
});

describe("AI audit event schema", () => {
  it("requires kind and surface", () => {
    expect(
      recordAiAuditEventInputSchema.safeParse({
        kind: AiAuditEventKind.SUGGESTION,
        surface: "health.insights",
        payload: { insightKind: "ai_guardrail" },
      }).success,
    ).toBe(true);

    expect(
      recordAiAuditEventInputSchema.safeParse({
        kind: "invented",
        surface: "x",
      }).success,
    ).toBe(false);
  });
});
