# Ledger Invariants

## Immutable Ledger Truths

1. Money is never created by the system. Every positive real-money effect must be traceable to an external source, transfer counterpart, refund, product settlement, loan disbursement, confirmed investment proceeds, or correction chain.
2. Money is never destroyed by the system. Every negative real-money effect must be traceable to an account outflow, product funding, repayment, fee, tax, penalty, transfer counterpart, reversal, refund, or correction chain.
3. Ledger is append-only. Posted financial history is never deleted or overwritten as if it never happened.
4. Every ledger mutation has household ownership, actor or system principal, account context, source command, timestamp, currency, reason, and causal origin.
5. Every transaction has ownership. A transaction without household, account, and authorized context is invalid and must not become active truth.
6. Every reversal has origin. A reversal must reference the transaction it reverses.
7. Every correction preserves history. A correction requires original, reversal, and corrected transaction links.
8. Every refund references original transaction when identifiable. If the original cannot be identified, the refund remains review-visible and cannot be ordinary income by default.
9. No orphan transaction exists. Every active ledger transaction must be reachable from household, account, source command, and domain meaning or explicit review state.

## Verification

Pass at business-rule level. BR-02 and BR-03 define refund linkage and 3-way correction audit chains. Transactions blueprint preserves history, rejects deletion, requires account context, and treats invalid attempts as preserving prior state.

## Engineering Contracts

- Reject `Posted` transactions without `household_id`, `account_id`, `currency`, `amount`, `posted_at`, and source metadata.
- Enforce linked records for refund, reversal, and correction states.
- Prevent physical delete of posted ledger rows.
- Preserve prior active state until full correction chain commit succeeds.
- Treat duplicate active meaning as idempotent success or Needs Review, never duplicate income or expense.

