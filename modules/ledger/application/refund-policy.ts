import {
  TransactionStatus,
  type TransactionStatus as TransactionStatusValue,
} from "./ledger-constants";

/**
 * BR-02 — after posting a refund of `refundAmount` against an expense of
 * `originalAmount` that already has `priorRefundTotal` linked refunds.
 */
export function resolveRefundedStatus(
  originalAmount: number,
  priorRefundTotal: number,
  refundAmount: number,
):
  | typeof TransactionStatus.PARTIALLY_REFUNDED
  | typeof TransactionStatus.FULLY_REFUNDED {
  const nextTotal = priorRefundTotal + refundAmount;
  if (nextTotal >= originalAmount) {
    return TransactionStatus.FULLY_REFUNDED;
  }
  return TransactionStatus.PARTIALLY_REFUNDED;
}

/**
 * Jar capacity delta when a refund income is posted to the original expense jar.
 * Positive = capacity restored (BR-02 / REQ-JAR-01).
 * Refund legs are is_reversal — restore capacity without monthly income inflation.
 */
export function jarCapacityRestoredByRefund(refundAmount: number): number {
  return refundAmount > 0 ? refundAmount : 0;
}

const REFUNDABLE_TRANSACTION_STATUSES = new Set<string>([
  TransactionStatus.POSTED,
  TransactionStatus.PARTIALLY_REFUNDED,
]);

export function isRefundableStatus(
  status: TransactionStatusValue | string,
): boolean {
  return REFUNDABLE_TRANSACTION_STATUSES.has(status);
}
