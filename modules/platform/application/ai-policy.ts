/**
 * BR-14 AI Non-Invention Policy Guards.
 * Deterministic — no LLM. Blocks invented amounts and autonomous money moves.
 */

export const AI_POLICY_ERROR_CODE = {
  INVENTED_AMOUNT: "invented_amount",
  AUTONOMOUS_MONEY_MOVE: "autonomous_money_move",
  UNGROUNDED_PARAMS: "ungrounded_params",
} as const;

export type AiPolicyErrorCode =
  (typeof AI_POLICY_ERROR_CODE)[keyof typeof AI_POLICY_ERROR_CODE];

export type AiPolicyResult =
  { ok: true } | { ok: false; code: AiPolicyErrorCode };

/**
 * Suggestions may only reference verified amounts (or none).
 * Health insights use counts-only params — pass `countsOnly: true`.
 */
export function assertAiSuggestionGrounded(input: {
  countsOnly?: boolean;
  params?: Record<string, unknown>;
  proposedAmounts?: number[];
  verifiedAmounts?: number[];
}): AiPolicyResult {
  if (input.countsOnly) {
    const params = input.params ?? {};
    for (const value of Object.values(params)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { ok: false, code: AI_POLICY_ERROR_CODE.UNGROUNDED_PARAMS };
      }
    }
    if ((input.proposedAmounts?.length ?? 0) > 0) {
      return { ok: false, code: AI_POLICY_ERROR_CODE.INVENTED_AMOUNT };
    }
    return { ok: true };
  }

  const verified = new Set(input.verifiedAmounts ?? []);
  for (const amount of input.proposedAmounts ?? []) {
    if (!verified.has(amount)) {
      return { ok: false, code: AI_POLICY_ERROR_CODE.INVENTED_AMOUNT };
    }
  }
  return { ok: true };
}

/**
 * Assist may suggest; it must never execute money movement without explicit user approval.
 */
export function assertNoAutonomousMoneyMove(input: {
  executesMoneyMove: boolean;
  userExplicitlyApproved: boolean;
}): AiPolicyResult {
  if (input.executesMoneyMove && !input.userExplicitlyApproved) {
    return { ok: false, code: AI_POLICY_ERROR_CODE.AUTONOMOUS_MONEY_MOVE };
  }
  return { ok: true };
}
