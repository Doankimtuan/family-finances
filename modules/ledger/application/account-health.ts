/**
 * Presentation-only liquid account health signals (not Health BC).
 * Balance-based for MVP; stale activity deferred to roadmap.
 */

export const AccountHealthSignal = {
  ZERO: "zero",
  OK: "ok",
} as const;

export type AccountHealthSignal =
  (typeof AccountHealthSignal)[keyof typeof AccountHealthSignal];

export const ACCOUNT_HEALTH_SIGNAL_VALUES = [
  AccountHealthSignal.ZERO,
  AccountHealthSignal.OK,
] as const;

export function accountHealthFromBalance(balance: number): AccountHealthSignal {
  if (!Number.isFinite(balance) || balance === 0) {
    return AccountHealthSignal.ZERO;
  }
  return AccountHealthSignal.OK;
}
