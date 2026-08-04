import { TransactionDirection, TransactionStatus } from "./ledger-constants";

export type CorrectionChainDraft = {
  originalId: string;
  originalAmount: number;
  originalType:
    typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME;
  correctionAmount: number;
  correctionType:
    typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME;
};

export type CorrectionChainLegs = {
  originalStatus: typeof TransactionStatus.REVERSED;
  reversal: {
    type:
      typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME;
    amount: number;
    reversesTransactionId: string;
    status: typeof TransactionStatus.POSTED;
  };
  correction: {
    type:
      typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME;
    amount: number;
    correctsTransactionId: string;
    status: typeof TransactionStatus.POSTED;
  };
};

/**
 * Opposite direction for a full reversal leg (BR-03).
 */
export function oppositeDirection(
  type:
    typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME,
): typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME {
  return type === TransactionDirection.EXPENSE
    ? TransactionDirection.INCOME
    : TransactionDirection.EXPENSE;
}

/**
 * Build the three immutable legs of a correction (BR-03 / AC-TRN-02).
 * Net signed impact vs original = (correction signed) − (original signed).
 */
export function buildCorrectionChain(
  draft: CorrectionChainDraft,
): CorrectionChainLegs {
  return {
    originalStatus: TransactionStatus.REVERSED,
    reversal: {
      type: oppositeDirection(draft.originalType),
      amount: draft.originalAmount,
      reversesTransactionId: draft.originalId,
      status: TransactionStatus.POSTED,
    },
    correction: {
      type: draft.correctionType,
      amount: draft.correctionAmount,
      correctsTransactionId: draft.originalId,
      status: TransactionStatus.POSTED,
    },
  };
}

/** Signed ledger delta for a single leg (expense negative, income positive). */
export function signedAmount(
  type:
    typeof TransactionDirection.EXPENSE | typeof TransactionDirection.INCOME,
  amount: number,
): number {
  return type === TransactionDirection.EXPENSE ? -amount : amount;
}

/**
 * Net balance impact of the full 3-way chain relative to leaving the original
 * posted: equals correction signed amount − original signed amount.
 */
export function correctionChainNetImpact(draft: CorrectionChainDraft): number {
  const legs = buildCorrectionChain(draft);
  const reverseSigned = signedAmount(legs.reversal.type, legs.reversal.amount);
  const correctionSigned = signedAmount(
    legs.correction.type,
    legs.correction.amount,
  );
  // Original remains in ledger but status Reversed; economic net of new legs:
  return reverseSigned + correctionSigned;
}
