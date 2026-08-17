import {
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  MERCHANT_CONFIRMATION_THRESHOLD,
  InboxItemKind,
  type InboxItemKind as InboxItemKindValue,
} from "./inbox-constants";

/**
 * BR-16 pattern / merchant auto-resolution policy.
 */

export function confidenceFromConfirmations(confirmationCount: number): number {
  if (confirmationCount >= MERCHANT_CONFIRMATION_THRESHOLD) {
    return AUTO_RESOLVE_CONFIDENCE_THRESHOLD;
  }
  if (confirmationCount <= 0) return 0;
  return Math.min(
    AUTO_RESOLVE_CONFIDENCE_THRESHOLD - 0.01,
    confirmationCount / MERCHANT_CONFIRMATION_THRESHOLD,
  );
}

export function meetsAutoResolveConfidence(
  confidenceScore: number | null | undefined,
): boolean {
  if (confidenceScore == null) return false;
  return confidenceScore >= AUTO_RESOLVE_CONFIDENCE_THRESHOLD;
}

export function shouldAutoResolveInboxItem(input: {
  kind: InboxItemKindValue;
  confidenceScore: number | null | undefined;
  suggestedJarId: string | null | undefined;
}): boolean {
  if (
    input.kind !== InboxItemKind.UNMAPPED_EXPENSE &&
    input.kind !== InboxItemKind.INCOME_SUGGEST
  ) {
    return false;
  }
  if (!input.suggestedJarId) return false;
  return meetsAutoResolveConfidence(input.confidenceScore);
}

/**
 * BR-21 — resolving the single canonical savings maturity kind cancels
 * sibling cascade timers for the same saving (Prompt 13A: one kind).
 */
export function shouldCancelMaturityCascade(input: {
  kind: InboxItemKindValue;
  resolved: boolean;
}): boolean {
  if (!input.resolved) return false;
  return input.kind === InboxItemKind.SAVINGS_MATURITY;
}
