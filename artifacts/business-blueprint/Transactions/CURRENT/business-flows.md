# Business Flows

## Record Income

Trigger:

- Money enters a household account.

Preconditions:

- Household context is valid.
- Account is active and real.
- Amount, currency, date, and account are known.
- Direction is income.

Business Rules:

- Income is real ledger movement.
- Income must not be virtual planning allocation.
- Income may need review if household meaning is incomplete.

Expected Result:

- Income transaction becomes a recorded fact.
- Account position becomes explainable.
- Transaction is Resolved or Needs Review.

Failure Result:

- No transaction fact is created when required facts are missing or account is invalid.

## Record Expense

Trigger:

- Money leaves a household account.

Preconditions:

- Household context is valid.
- Account is active and real.
- Amount, currency, date, and account are known.
- Direction is expense.

Business Rules:

- Expense is real ledger movement.
- Expense must not be treated as jar movement.
- Unmapped or unclear expense may require review.

Expected Result:

- Expense transaction becomes a recorded fact.
- Account position becomes explainable.
- Transaction is Resolved or Needs Review.

Failure Result:

- No transaction fact is created when required facts are missing, amount is invalid, or account is invalid.

## Record Owned-Account Transfer

Trigger:

- Money moves between household-owned accounts or containers.

Preconditions:

- Source and destination are recognized as household-owned real containers.
- Amount, currency, date, source, and destination are known enough for business truth.

Business Rules:

- Transfer is real ledger movement.
- Transfer is not income by default.
- Transfer is not expense by default.
- Transfer has no jar impact by default.
- Fees, if any, are separate expense meaning.

Expected Result:

- Money location changes.
- Household total real position remains neutral except separately recognized fees or exchange effects.
- Transfer becomes Resolved or Needs Review if ownership/purpose is unclear.

Failure Result:

- Movement remains Needs Review if owned-account neutrality cannot be established.

## Add Or Change Household Meaning

Trigger:

- Household clarifies what a transaction was for.

Preconditions:

- Transaction exists.
- New meaning does not change financial fact.

Business Rules:

- Category is explanatory.
- Meaning changes do not move real money.
- Meaning changes do not automatically create planning movement.

Expected Result:

- Transaction remains the same real ledger fact with clearer household meaning.
- Needs Review may become Resolved.

Failure Result:

- Boundary-breaking meaning is rejected and prior valid meaning remains.

## Send To Review

Trigger:

- Transaction is real but meaning, category, transfer interpretation, or planning reference is incomplete.

Preconditions:

- Transaction fact exists.
- Review need is connected to transaction understanding, not to changing real money.

Business Rules:

- Review does not alter transaction truth.
- Review belongs to household decision work.
- Review cannot be used to hide or delete a transaction.

Expected Result:

- Transaction becomes Needs Review.
- Inbox may consume the review need.

Failure Result:

- If no transaction fact exists, review work is not created as transaction review.

## Resolve Review

Trigger:

- Household decides the meaning of an unresolved transaction.

Preconditions:

- Transaction is Needs Review.
- Household decision is valid and within boundaries.

Business Rules:

- Resolution clarifies meaning.
- Resolution does not mutate amount, account, date, currency, or real direction.
- Resolution may connect to category or planning reference without violating BR-01.

Expected Result:

- Transaction becomes Resolved.
- Other domains may consume the clarified fact.

Failure Result:

- If decision violates real/virtual boundaries, transaction remains Needs Review.

## Search Or Filter Activity

Trigger:

- Household asks what happened, where money went, or whether a transaction exists.

Preconditions:

- Transaction history exists.

Business Rules:

- Search and filtering are read-only.
- Retrieval does not change transaction state.
- Results must preserve factual interpretation.

Expected Result:

- Household receives relevant transaction history for review.

Failure Result:

- If no matching activity exists, transaction state remains unchanged.

## Record Refund

Trigger:

- Money returns in relation to a previous expense.

Preconditions:

- Original transaction is identifiable or refund remains unresolved.
- Refund amount, account, date, and direction are known.

Business Rules:

- Refund is a real ledger event.
- Refund must not be treated as ordinary income when linked to prior expense meaning.
- Partial and full refunds preserve the original story.

Expected Result:

- Refund-linked history explains both the original expense and returned money.
- Account position becomes explainable.

Failure Result:

- If original cannot be identified, refund remains a transaction needing review.

## Correct Transaction

Trigger:

- Household determines a transaction fact was recorded incorrectly.

Preconditions:

- Original transaction exists.
- Correction reason is explainable.
- Corrected meaning preserves audit truth.

Business Rules:

- Correction must not silently overwrite history.
- Correction must explain what was wrong and what is now trusted.
- Correction remains real ledger behavior, not planning behavior.

Expected Result:

- Transaction history becomes corrected and explainable.
- Prior valid business story remains traceable.

Failure Result:

- If correction is not explainable or violates boundaries, original transaction remains unchanged and may Needs Review.

## Reverse Transaction

Trigger:

- A previous transaction must be unwound because it should not stand as active financial truth.

Preconditions:

- Original transaction exists.
- Reversal reason is valid and explainable.

Business Rules:

- Reversal does not erase history.
- Reversal must preserve audit truth.
- Reversal cannot be used as ordinary deletion.

Expected Result:

- Original transaction becomes reversed in business meaning.
- History explains both original and reversal.

Failure Result:

- Invalid reversal attempt is rejected; prior state remains.

## Lightweight Reconciliation

Trigger:

- Household compares transaction history with bank, wallet, card, cash, or memory.

Preconditions:

- Transaction history exists.
- A real-world reference or discrepancy exists.

Business Rules:

- Reconciliation is confidence behavior.
- Reconciliation does not make provider automation authoritative.
- Discrepancy must lead to review, correction, refund, reversal, or no change.

Expected Result:

- Household trust increases, or unresolved differences are marked for review.

Failure Result:

- If truth cannot be established, transactions remain in prior valid state or Needs Review.

## Archive As Historical

Trigger:

- Transaction is no longer active review work but remains part of household history.

Preconditions:

- Transaction exists.

Business Rules:

- Historical transaction remains visible to business interpretation.
- Archive is not deletion.
- Historical records may still be referenced by refunds, corrections, and account explanations.

Expected Result:

- Transaction remains part of chronological household memory.

Failure Result:

- If unresolved work still matters, transaction remains Needs Review.
